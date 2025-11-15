import { Sequelize } from "sequelize-typescript";
import { ConfigService } from "./../shared/config/config.service";

export const databaseProviders = [
  {
    provide: "SEQUELIZE",
    useFactory: async (configService: ConfigService) => {
      const dbConfig: any = configService.sequelizeOrmConfig;
      const sequelizeOptions = {
        ...dbConfig,
        sync: {
          force: false,
          alter: false,
        },
        logging: false,
        define: {
          timestamps: true,
          freezeTableName: true,
          underscored: true,
        },
        pool: {
          max: 5, // Reduce max connections for dev
          min: 0,
          acquire: 10000, // Reduce from 50000ms to 10000ms
          idle: 5000, // Reduce from 10000ms to 5000ms
        },
      };

      const sequelize = new Sequelize(sequelizeOptions);
      // Add models here as you create them
      // sequelize.addModels([...]);
      
      try {
        await sequelize.authenticate();
        console.log("✅ Database connection established successfully.");
        await sequelize.sync();
        return sequelize;
      } catch (error: any) {
        const errorMessage = error?.message || error?.parent?.message || String(error);
        console.error("❌ Unable to connect to the database:", errorMessage);
        if (errorMessage.includes("password authentication failed")) {
          console.error("💡 Please check your DATABASE_USER and DATABASE_PASSWORD in your .env file.");
        } else if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("ECONNREFUSED")) {
          console.error("💡 Please check your DATABASE_HOST and DATABASE_PORT in your .env file.");
        } else if (errorMessage.includes("does not exist") || error?.code === "3D000") {
          console.error("💡 The database specified in DATABASE_NAME does not exist.");
          console.error(`   Database name: ${dbConfig.database}`);
          console.error("   Please create the database first using:");
          console.error(`   CREATE DATABASE "${dbConfig.database}";`);
          console.error("   Or update DATABASE_NAME in your .env file to an existing database.");
        }
        throw error;
      }
    },
    inject: [ConfigService],
  },
];


