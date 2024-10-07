import { Request, Response } from 'express';
import { getClientAuthToken } from '@cord-sdk/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const cordConfigPath =
  process.env.CORD_CONFIG_PATH ?? path.join(os.homedir(), '.cord');
const asyncFs = fs.promises;

const KEYS = [
    'VERSION_LAST_CHECKED',
    'CORD_PROJECT_ID',
    'CORD_PROJECT_SECRET',
    'CORD_CUSTOMER_ID',
    'CORD_CUSTOMER_SECRET',
    'CORD_API_URL',
  ] as const;
  type EnvKey = (typeof KEYS)[number];
  type Env = Partial<{ [key in EnvKey]: string }>;
  
  function isEnvKey(input: string): input is EnvKey {
    return KEYS.includes(input as EnvKey);
  }

export async function getEnvVariables() {
  const env: Env = {};
  const data = await asyncFs.readFile(cordConfigPath, 'utf-8');
  if (data) {
    data
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .forEach((entry) => {
        const [key, value] = entry.split('=');
        const trimmedKey = key.trim();
        if (isEnvKey(trimmedKey)) {
          env[trimmedKey] = value.trim();
        }
      });
  }
  return env;
}


export default async function GenerateCordTokenHandler(req: Request<{userId: string}>, res: Response) {
    console.log('Generating Cord token for user:', req.body.userId);
    const env = await getEnvVariables().catch(() => {
        // Handle the error case
        res.status(500).json({ error: 'Failed to get environment variables' });
        return null;
    });

    if (!env) {
        return res.status(400).json({ error: 'Failed to get environment variables' });
    }

    if (!env.CORD_PROJECT_ID || !env.CORD_PROJECT_SECRET) {
        return res.status(400).json({ error: 'CORD_PROJECT_ID and CORD_PROJECT_SECRET must be set' });
    }

  const clientAuthToken = getClientAuthToken(
    env.CORD_PROJECT_ID,
    env.CORD_PROJECT_SECRET,
    {
      // Replace this with actual user authentication logic
      user_id: req.body.userId,
    },
  );

  return res.json({ clientAuthToken });
}