import { execSync, spawnSync } from 'node:child_process';

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

const result = spawnSync('npx', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
