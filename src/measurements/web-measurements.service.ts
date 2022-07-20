import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import _ from 'lodash';

@Injectable()
export class WebMeasurementsService {
  constructor(private readonly httpService: HttpService) {}

  async findAll(city: string, measurementType: string) {
    const devices = await lastValueFrom(
      this.httpService.get(`https://${city}.pulse.eco/rest/sensor`),
    );

    const { from, to } = getDates();

    const allMeasurementsPromises = devices.data.map(async (device) => {
      const measurements = await lastValueFrom(
        this.httpService.get(
          `https://${city}.pulse.eco/rest/avgData/day?sensorId=${device.sensorId}&type=${measurementType}&from=${from}&to=${to}`,
        ),
      );

      return {
        id: device.sensorId,
        data: measurements.data.map((d) => {
          return {
            x: new Date(d.stamp),
            y: parseInt(d.value),
          };
        }),
      };
    });

    return await Promise.all(allMeasurementsPromises);
  }
}

function getDates() {
  const from = getQueryDate(true);
  const to = getQueryDate();

  return { from, to };
}

function getQueryDate(lastYear = false) {
  const date = new Date();

  const cDay = date.getDate().toString().padStart(2, '0');
  const cMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  let cYear = date.getFullYear();
  if (lastYear) {
    cYear = cYear - 1;
  }

  return `${cYear}-${cMonth}-${cDay}T12:00:00%2b01:00`;
}
