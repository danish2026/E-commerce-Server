import { Injectable } from "@nestjs/common";
import config from "../../../config";

@Injectable()
export class ConfigService {
  get sequelizeOrmConfig() {
    return config.database;
  }

  get jwtConfig() {
    return { 
      privateKey: config.jwtPrivateKey,
      secret: config.jwtSecret,
      expiry: config.jwtExpiry,
    };
  }

  get firebaseConfig() {
    return config.firebase;
  }

  get awsConfig() {
    return config.aws;
  }

  get serverConfig() {
    return config.server;
  }
}


