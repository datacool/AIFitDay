import { NextResponse } from "next/server"

const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1/forecast.json"

type WeatherConditionType = "sun" | "cloud" | "rain"

interface WeatherDay {
  date: string
  dayLabel: string
  maxTempC: number
  minTempC: number
  conditionText: string
  chanceOfRain: number
  conditionType: WeatherConditionType
}

interface WeatherHour {
  timeLabel: string
  tempC: number
  chanceOfRain: number
  conditionType: WeatherConditionType
  conditionText: string
}

interface NominatimAddress {
  neighbourhood?: string
  suburb?: string
  quarter?: string
  city_district?: string
  borough?: string
  town?: string
  village?: string
  hamlet?: string
  city?: string
  county?: string
  state?: string
  province?: string
}

interface NominatimResponse {
  address?: NominatimAddress
}

interface LocationCoordinates {
  latitude: number
  longitude: number
}

/** 좌표 문자열인지 판별하고 위경도를 반환한다. */
const parseCoordinateQuery = (location: string): LocationCoordinates | null => {
  const isCoordinate = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(location)
  if (!isCoordinate) return null

  const [latText, lonText] = location.split(",").map((value) => value.trim())
  const latitude = Number(latText)
  const longitude = Number(lonText)

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null

  return { latitude, longitude }
}

/** 지역명을 한국어 포맷으로 정규화한다. */
const normalizeRegionLabel = (value: string) => {
  const normalized = value.toLowerCase()
  const hasSeoulToken =
    normalized.includes("seoul") ||
    normalized.includes("서울") ||
    normalized.includes("tukpyol")
  if (hasSeoulToken) return "서울특별시"
  return value
}

/** 위치명을 한국어 표기로 정규화한다. */
const normalizeDistrictLabel = (value: string) => {
  const normalized = value.toLowerCase().replace(/\s+/g, "")
  if (normalized === "seoul") return "서울"
  if (normalized === "ahyeon-dong" || normalized === "ahyeondong") return "아현동"
  if (normalized === "ahyon-dong" || normalized === "ahyondong") return "북아현동"
  return value
}

/** 좌표를 기준으로 동네/지역명을 역지오코딩한다. */
const resolveLocationFromCoordinates = async (
  latitude: number,
  longitude: number
) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=ko&zoom=18&addressdetails=1`

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "AIFitDay/1.0 (location-label)",
    },
  })

  if (!response.ok) return { district: "", region: "" }

  const data = (await response.json()) as NominatimResponse
  const address = data.address
  if (!address) return { district: "", region: "" }

  const districtRaw =
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.city_district ||
    address.borough ||
    address.town ||
    address.village ||
    address.hamlet ||
    ""
  const district = districtRaw ? normalizeDistrictLabel(districtRaw) : ""

  const rawRegion = address.city || address.state || address.province || address.county || ""
  const region = rawRegion ? normalizeRegionLabel(rawRegion) : ""

  return { district, region }
}

/** WeatherAPI 결과와 좌표 역지오코딩 결과를 결합해 위치 라벨을 만든다. */
const getLocalizedLocationLabel = async (
  location: string,
  name: string,
  region: string,
  fallbackCoordinates?: LocationCoordinates
) => {
  const coordinate = parseCoordinateQuery(location) ?? fallbackCoordinates

  if (coordinate) {
    try {
      const resolved = await resolveLocationFromCoordinates(
        coordinate.latitude,
        coordinate.longitude
      )
      if (resolved.district && resolved.region) {
        return `${resolved.district}, ${resolved.region}`
      }
      if (resolved.district) {
        return resolved.district
      }
      if (resolved.region) {
        return resolved.region
      }
    } catch {
      // 역지오코딩 실패 시 WeatherAPI 결과를 사용한다.
    }
  }

  const normalizedName = normalizeDistrictLabel(name || "")
  const normalizedRegion = normalizeRegionLabel(region || "")
  if (!normalizedRegion) return normalizedName
  if (normalizedName === normalizedRegion) return normalizedRegion
  return `${normalizedName}, ${normalizedRegion}`
}

/** 야외 활동 적합도 점수를 계산한다. */
const calculateActivityScore = (
  tempC: number,
  chanceOfRain: number,
  windSpeedMs: number
) => {
  let score = 100

  score -= Math.abs(tempC - 20) * 2.2
  score -= chanceOfRain * 0.35
  score -= windSpeedMs * 2.5

  return Math.max(0, Math.min(100, Math.round(score)))
}

/** 날씨 상태 텍스트/강수 정보를 기준으로 아이콘 타입을 결정한다. */
const resolveConditionType = (
  conditionText: string,
  chanceOfRain: number
): WeatherConditionType => {
  const normalized = conditionText.toLowerCase()
  const isRainy =
    chanceOfRain >= 40 ||
    normalized.includes("비") ||
    normalized.includes("rain") ||
    normalized.includes("shower") ||
    normalized.includes("drizzle")

  if (isRainy) return "rain"

  const isCloudy =
    normalized.includes("흐") ||
    normalized.includes("구름") ||
    normalized.includes("cloud") ||
    normalized.includes("overcast") ||
    normalized.includes("mist") ||
    normalized.includes("fog")

  if (isCloudy) return "cloud"

  return "sun"
}

/** 요일 라벨을 한국어 한 글자로 변환한다. */
const getDayLabel = (value: string) => {
  const date = new Date(value)
  const day = date.getDay()
  const labels = ["일", "월", "화", "수", "목", "금", "토"]
  return labels[day] ?? ""
}

/** 시간 문자열을 한국어 시간 라벨로 변환한다. */
const getHourLabel = (value: string) => {
  const [datePart, timePart] = value.split(" ")
  if (!datePart || !timePart) return value
  const hourText = timePart.split(":")[0]
  const hour = Number(hourText)
  if (Number.isNaN(hour)) return timePart
  return `${hour}시`
}

/** WeatherAPI를 호출하고 표준 응답 형태로 변환한다. */
const fetchForecast = async (apiKey: string, location: string, days: number) => {
  const url = `${WEATHER_API_BASE_URL}?key=${apiKey}&q=${encodeURIComponent(
    location
  )}&days=${days}&aqi=no&alerts=no&lang=ko`

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "날씨 정보를 불러오지 못했습니다.")
  }

  const data = await response.json()
  const forecastDays: WeatherDay[] = data.forecast.forecastday.map(
    (item: {
      date: string
      day: {
        maxtemp_c: number
        mintemp_c: number
        daily_chance_of_rain: number
        condition: { text: string }
      }
    }) => {
      const chance = Number(item.day.daily_chance_of_rain ?? 0)
      const text = item.day.condition.text

      return {
        date: item.date,
        dayLabel: getDayLabel(item.date),
        maxTempC: Math.round(item.day.maxtemp_c),
        minTempC: Math.round(item.day.mintemp_c),
        conditionText: text,
        chanceOfRain: chance,
        conditionType: resolveConditionType(text, chance),
      }
    }
  )

  const today = forecastDays[0] ?? null
  const windSpeedMs = Number((data.current.wind_kph / 3.6).toFixed(1))
  const nowEpoch = Number(data.location.localtime_epoch ?? 0)
  const hourly: WeatherHour[] = (data.forecast.forecastday as Array<{
    hour: Array<{
      time: string
      time_epoch: number
      temp_c: number
      chance_of_rain: number
      condition: { text: string }
    }>
  }>)
    .flatMap((day) => day.hour)
    .filter((hourItem) => hourItem.time_epoch >= nowEpoch)
    .slice(0, 8)
    .map((hourItem) => {
      const chance = Number(hourItem.chance_of_rain ?? 0)
      const text = hourItem.condition.text

      return {
        timeLabel: getHourLabel(hourItem.time),
        tempC: Math.round(hourItem.temp_c),
        chanceOfRain: chance,
        conditionType: resolveConditionType(text, chance),
        conditionText: text,
      }
    })
  const activityScore = calculateActivityScore(
    Math.round(data.current.temp_c),
    today?.chanceOfRain ?? 0,
    windSpeedMs
  )

  const locationDisplay = await getLocalizedLocationLabel(
    location,
    data.location.name,
    data.location.region,
    {
      latitude: Number(data.location.lat),
      longitude: Number(data.location.lon),
    }
  )

  return {
    location: data.location.name,
    locationDisplay,
    current: {
      tempC: Math.round(data.current.temp_c),
      feelsLikeC: Math.round(data.current.feelslike_c),
      humidity: Number(data.current.humidity),
      windSpeed: windSpeedMs,
      conditionText: data.current.condition.text,
      conditionType: resolveConditionType(
        data.current.condition.text,
        today?.chanceOfRain ?? 0
      ),
    },
    today,
    tomorrow: forecastDays[1] ?? null,
    weekly: forecastDays,
    hourly,
    activityScore,
  }
}

export async function GET(request: Request) {
  const apiKey = process.env.WEATHERAPI_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "WEATHERAPI_KEY가 설정되지 않았습니다." },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const location = searchParams.get("location") ?? "Seoul"

  try {
    // 플랜 제한에 따라 14일이 실패할 수 있어 단계적으로 폴백한다.
    const dayOptions = [14, 10, 7, 3]
    let lastError: unknown = null

    for (const days of dayOptions) {
      try {
        const weather = await fetchForecast(apiKey, location, days)
        return NextResponse.json(weather, { status: 200 })
      } catch (error) {
        lastError = error
      }
    }

    return NextResponse.json(
      {
        error:
          lastError instanceof Error
            ? lastError.message
            : "날씨 정보를 불러오지 못했습니다.",
      },
      { status: 500 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "날씨 정보를 불러오지 못했습니다.",
      },
      { status: 500 }
    )
  }
}
