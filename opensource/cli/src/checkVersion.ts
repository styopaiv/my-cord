import chalk from 'chalk';
import Box from 'cli-box';
import fetch from 'node-fetch';
import {
  getEnvVariables,
  isLaterCliVersion,
  updateEnvVariables,
} from 'src/utils';
import packageData from 'package.json';

export async function checkVersion() {
  const variables = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });

  if (variables?.VERSION_LAST_CHECKED) {
    const lastValidVersionDate = new Date(+variables.VERSION_LAST_CHECKED);
    lastValidVersionDate.setDate(lastValidVersionDate.getDate() + 1);
    if (lastValidVersionDate.getTime() > Date.now()) {
      return;
    }
  }

  try {
    const res = await fetch('https://localhost:8161/v1/cli-version', {
      agent: new (require('https').Agent)({ rejectUnauthorized: false }),
      headers: {
        'User-Agent': 'Cord CLI',
      },
    });
    const response = (await res.json()) as { version: string };
    const publishedVersion: string = response.version;
    await updateEnvVariables({
      VERSION_LAST_CHECKED: Date.now().toString(),
    });

    if (isLaterCliVersion(publishedVersion, packageData.version)) {
      const box = Box(
        { h: 3, w: 50, stringify: false },
        `👋 ${chalk.bold('There is a newer version available!')}
To update from ${chalk.bold(packageData.version)} to ${chalk.bold(
          publishedVersion,
        )} run:
npm update -g @cord-sdk/cli\n`,
      );
      process.stderr.write(box.stringify() + '\n');
    }
  } catch (error: any) {
    console.warn(chalk.yellow('Unable to check for CLI updates. Continuing without version check.'));
    console.warn(chalk.yellow(`Error details: ${error.message}`));
  }
}
