declare module "lunar-javascript" {
  export interface SolarDate {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }

  export interface LunarDate {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): SolarDate;
  }

  export const Lunar: {
    fromDate(date: Date): LunarDate;
    fromYmd(year: number, month: number, day: number): LunarDate;
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): LunarDate;
  };

  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarDate;
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): SolarDate;
  };
}
