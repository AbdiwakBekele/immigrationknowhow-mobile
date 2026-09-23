import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function listDevices() {
  try {
    const output = execSync('adb devices -l', { encoding: 'utf8' });
    return output
      .split('\n')
      .slice(1)
      .map((line) => line.trim())
      .filter((line) => line.includes(' device '))
      .map((line) => {
        const serial = line.split(/\s+/)[0];
        const modelMatch = line.match(/model:(\S+)/);
        const name = modelMatch?.[1] ?? serial;
        return { serial, name };
      });
  } catch {
    return [];
  }
}

/**
 * Cursor/sandbox Gradle caches can exceed Windows' 260-char path limit during CMake/ninja.
 * Prefer a short GRADLE_USER_HOME unless the user already set a non-sandbox path.
 */
function resolveGradleEnv() {
  const env = { ...process.env };
  if (process.platform !== 'win32') {
    return env;
  }

  const current = env.GRADLE_USER_HOME?.trim() || '';
  const usesSandboxCache = /cursor-sandbox-cache/i.test(current);
  if (current && !usesSandboxCache) {
    return env;
  }

  const shortHome = join(homedir(), '.gradle-ikh');
  mkdirSync(shortHome, { recursive: true });
  env.GRADLE_USER_HOME = shortHome;
  console.log(`Using GRADLE_USER_HOME=${shortHome} (avoids Windows 260-char path limit)`);
  return env;
}

const devices = listDevices();
const args = ['expo', 'run:android'];

if (devices.length >= 1) {
  const target = devices[0];
  args.push('-d', target.name);
  if (devices.length > 1) {
    console.log(`Multiple Android devices found; using ${target.name} (${target.serial}).`);
    console.log(`Others: ${devices.slice(1).map((d) => `${d.name} (${d.serial})`).join(', ')}`);
  }
}

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: resolveGradleEnv(),
});
process.exit(result.status ?? 1);
