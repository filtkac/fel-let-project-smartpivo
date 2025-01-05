'use client';

import useStore from '@/store/store';
import { Scatter } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  registerables,
  TimeScale,
  Title,
  Tooltip
} from 'chart.js';
import { useEffect, useState } from 'react';
import { getAlcoholRecords } from '@/actions/api';
import 'chartjs-adapter-date-fns';
import { AlcoholRecord } from '@/actions/types';

Chart.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, ...registerables);


export default function AlcoholRecords() {
  const { activeUser } = useStore();
  const [alcoholRecords, setAlcoholRecords] = useState<AlcoholRecord[]>([]);

  useEffect(() => {
    if (activeUser) {
      getAlcoholRecords(activeUser.id).then((res) => setAlcoholRecords(res));
    }
  }, [activeUser, setAlcoholRecords]);

  const data: ChartData<'scatter'> = {
    datasets: [
      {
        label: `Alkohol`,
        data: alcoholRecords.map(r => ({
          x: r.timestamp * 1000, y: r.alcohol
        })),
        fill: false,
        borderColor: 'rgb(0, 180, 0)',
        pointRadius: 0,
        tension: 0.2
      }
    ],
  }

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `${activeUser ? activeUser.name + " alkohol" : 'Alkohol'}`
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
        },
        title: {
          display: true,
          text: 'Čas'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Alkohol'
        },
      }
    }
  }

  return (
    <div className="bg-slate-200 rounded-lg p-6 lg:w-1/2 w-full" style={{minHeight: 400}}>
      <Scatter data={data} options={options}/>
    </div>
  )
}
