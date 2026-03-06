import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

 
export function setUser(name: string): void {
  const config = readConfig();

  const newRaw = {
    db_url: config.dbUrl,
    current_user_name: name,
  };

  fs.writeFileSync(
    getConfigFilePath(),
    JSON.stringify(newRaw, null, 2),
    "utf-8"
  );
}
 
export function readConfig(): Config {
  const file = fs.readFileSync(getConfigFilePath(), "utf-8");
  const parsed = JSON.parse(file);
  return validateConfig(parsed);
}

 
function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig.db_url !== "string") {
    throw new Error("Invalid config file");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}
 
function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}



