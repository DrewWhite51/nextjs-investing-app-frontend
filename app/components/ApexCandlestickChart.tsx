import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartDataItem {
  date: string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume?: number | string;
}

interface ApexCandlestickData {
  x: number;
  y: [number, number, number, number];
}

interface ApexCandlestickChartProps {
  data: ChartDataItem[];
}

export const ApexCandlestickChart: React.FC<ApexCandlestickChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  // Transform data for ApexCharts candlestick format
  const transformedData: ApexCandlestickData[] = data.map((item: ChartDataItem) => ({
    x: new Date(item.date).getTime(),
    y: [
      parseFloat(String(item.open)) || 0,
      parseFloat(String(item.high)) || 0,
      parseFloat(String(item.low)) || 0,
      parseFloat(String(item.close)) || 0
    ]
  }));

  const chartOptions = {
    chart: {
      type: 'candlestick' as const,
      height: 350,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout' as const,
        speed: 800,
      }
    },
    theme: {
      mode: 'dark' as const
    },
    title: {
      text: 'Stock Price Chart',
      align: 'left' as const,
      style: {
        color: '#f9fafb',
        fontSize: '16px',
        fontWeight: 600
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        style: {
          colors: '#9ca3af'
        },
        format: 'MMM dd'
      },
      axisBorder: {
        color: '#374151'
      },
      axisTicks: {
        color: '#374151'
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: '#9ca3af'
        },
        formatter: (value: number) => {
          return '$' + value.toFixed(2);
        }
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 3
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981',
          downward: '#ef4444'
        },
        wick: {
          useFillColor: true
        }
      }
    },
    tooltip: {
      theme: 'dark' as const,
      style: {
        fontSize: '12px',
        backgroundColor: '#1f2937'
      },
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const date = new Date(data.x).toLocaleDateString();
        const [open, high, low, close] = data.y;
        
        return `
          <div style="padding: 10px; background: #1f2937; border: 1px solid #374151; border-radius: 8px;">
            <div style="color: #f9fafb; font-weight: bold; margin-bottom: 5px;">${date}</div>
            <div style="color: #9ca3af;">
              <div>Open: <span style="color: #f9fafb;">$${open.toFixed(2)}</span></div>
              <div>High: <span style="color: #10b981;">$${high.toFixed(2)}</span></div>
              <div>Low: <span style="color: #ef4444;">$${low.toFixed(2)}</span></div>
              <div>Close: <span style="color: #f9fafb;">$${close.toFixed(2)}</span></div>
            </div>
          </div>
        `;
      }
    }
  };

  const series = [{
    name: 'Stock Price',
    data: transformedData
  }];

  return (
    <div className="w-full h-full">
      <ReactApexChart 
        options={chartOptions}
        series={series} 
        type="candlestick" 
        height={350} 
      />
    </div>
  );
};