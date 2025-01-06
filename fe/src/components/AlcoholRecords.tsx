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
import { getAlcoholRecords, getLatestAlcoholRecords, startBreathTest } from '@/actions/api';
import 'chartjs-adapter-date-fns';

Chart.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, ...registerables);

const emptyChartDataState: ChartData<'line'> = {
  datasets: [
    {
      label: `Alkohol`,
      data: [],
      fill: false,
      borderColor: 'rgb(0, 180, 0)',
      pointRadius: 0,
      tension: 0.2
    }
  ],
};

export default function AlcoholRecords() {
  const { activeUser } = useStore();
  const [, setAlcoholRecordsIds] = useState<number[]>([]);
  const [chartData, setChartData] = useState<ChartData<'line'>>(emptyChartDataState)

  useEffect(() => {
    if (activeUser) {
      getAlcoholRecords(activeUser.id).then((res) => {
        setAlcoholRecordsIds(res.map(r => r.id));
        setChartData((prevChartData) => ({
          ...prevChartData,
          datasets: [
            {
              ...prevChartData.datasets[0],
              data: res.map(r => ({ x: r.timestamp * 1000, y: r.alcohol })),
            }
          ]
        }));
      });

      const interval = setInterval(() => getLatestAlcoholRecords(activeUser.id)
        .then((latest) => {
          setAlcoholRecordsIds((prev) => {
            const latestSliceIds = prev.slice(-300);
            const toAdd = latest.filter(r => !latestSliceIds.includes(r.id));
            if (toAdd.length > 0) {
              setChartData((prevChartData) => {
                const oldData = prevChartData.datasets[0].data;
                const pointsToAdd = toAdd.map(r => ({ x: r.timestamp * 1000, y: r.alcohol }));
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
      setAlcoholRecordsIds([]);
      setChartData(emptyChartDataState);
    }
  }, [activeUser, setAlcoholRecordsIds]);

  const handleStartBreathTest = () => {
    startBreathTest().then(res => {
      const text = res.replaceAll('"', '');
      if (text.length > 0) {
        alert(text);
      }
    })
  }

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
  }), [activeUser]);

  return (
    <div className="flex flex-col w-full items-center">
      <div className="self-stretch bg-slate-200 rounded-lg p-6 w-full" style={{ height: '40vh' }}>
        <Line data={chartData} options={options}/>
      </div>
      <button
        className="px-3 py-2 mt-3 rounded-md bg-slate-600 text-white hover:bg-slate-700"
        onClick={handleStartBreathTest}
      >
        Dechová zkouška
      </button>
    </div>
  )
}
