export type AppEnv = {
  port: number;
  nodeEnv: string;
};

export const getEnv = (): AppEnv => ({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development"
});
