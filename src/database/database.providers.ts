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
      await sequelize.sync();
      return sequelize;
    },
    inject: [ConfigService],
  },
];

