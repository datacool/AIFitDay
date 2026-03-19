import { execSync, spawn } from "node:child_process"
import { rmSync, existsSync } from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const nextDir = path.join(projectRoot, ".next")

const killPort3000 = () => {
  try {
    if (process.platform === "win32") {
      const output = execSync('netstat -ano -p tcp | findstr ":3000"', {
        stdio: ["ignore", "pipe", "ignore"],
      }).toString()

      const pids = Array.from(
        new Set(
          output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.split(/\s+/).pop())
            .filter(Boolean)
        )
      )

      pids.forEach((pid) => {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" })
        } catch {
          // Ignore processes that already exited.
        }
      })
      return
    }

    const unixPids = execSync("lsof -ti tcp:3000", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)

    unixPids.forEach((pid) => {
      try {
        process.kill(Number(pid), "SIGKILL")
      } catch {
        // Ignore processes that already exited.
      }
    })
  } catch {
    // No process on port 3000.
  }
}

const cleanNextCache = () => {
  if (existsSync(nextDir)) {
    rmSync(nextDir, { recursive: true, force: true })
  }
}

const runDev = () => {
  const child = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  })

  child.on("exit", (code) => {
    process.exit(code ?? 0)
  })
}

killPort3000()
cleanNextCache()
runDev()
