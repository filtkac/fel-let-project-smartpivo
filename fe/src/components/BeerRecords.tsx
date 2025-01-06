'use client';

import useStore from '@/store/store';
import { Line } from 'react-chartjs-2';
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
import { useEffect, useMemo, useState } from 'react';
import 'chartjs-adapter-date-fns';
import { getBeerRecords, getLatestBeerRecords } from '@/actions/api';

Chart.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, ...registerables);

const emptyChartDataState: ChartData<'line'> = {
  datasets: [
    {
      label: `Pivo`,
      data: [],
      fill: false,
      borderColor: 'rgb(180, 0, 0)',
      pointRadius: 0,
      tension: 0.2
    }
  ],
};

export default function BeerRecords() {
  const { activeUser } = useStore();
  const [, setBeerRecordsIds] = useState<number[]>([]);
  const [chartData, setChartData] = useState<ChartData<'line'>>(emptyChartDataState)

  useEffect(() => {
    if (activeUser) {
      getBeerRecords(activeUser.id).then((res) => {
        setBeerRecordsIds(res.map(r => r.id));
        setChartData((prevChartData) => ({
          ...prevChartData,
          datasets: [
            {
              ...prevChartData.datasets[0],
              data: res.map(r => ({ x: r.timestamp * 1000, y: r.weight })),
            }
          ]
        }));
      });

      const interval = setInterval(() => getLatestBeerRecords(activeUser.id)
        .then((latest) => {
          setBeerRecordsIds((prev) => {
            const latestSliceIds = prev.slice(-300);
            const toAdd = latest.filter(r => !latestSliceIds.includes(r.id));
            if (toAdd.length > 0) {
              setChartData((prevChartData) => {
                const oldData = prevChartData.datasets[0].data;
                const pointsToAdd = toAdd.map(r => ({ x: r.timestamp * 1000, y: r.weight }));
                return {
                  ...prevChartData,
                  datasets: [
                    {
                      ...prevChartData.datasets[0],
                      data: [...oldData, ...pointsToAdd]
                    }
                  ]
                }
              });
              return [...prev, ...toAdd.map(r => r.id)]
            }
            return prev;
          });
        }), 3000);

      return () => clearInterval(interval);
    } else {
      setBeerRecordsIds([]);
      setChartData(emptyChartDataState);
    }
  }, [activeUser, setBeerRecordsIds]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `${activeUser ? activeUser.name + " pivo" : 'Pivo'}`
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
          text: 'Váha'
        },
      }
    }
  }), [activeUser]);

  return (
    <div className="bg-slate-200 rounded-lg p-6 w-full" style={{ height: '40vh' }}>
      <Line data={chartData} options={options}/>
    </div>
  )
}
