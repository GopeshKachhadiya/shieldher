import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export default function AnalyticsPage() {
  // Chart Mock Data
  const monthlyData = [
    { name: 'Jan', Stalking: 12, Fraud: 34, Harassment: 15 },
    { name: 'Feb', Stalking: 19, Fraud: 42, Harassment: 22 },
    { name: 'Mar', Stalking: 15, Fraud: 38, Harassment: 18 },
    { name: 'Apr', Stalking: 25, Fraud: 54, Harassment: 30 },
    { name: 'May', Stalking: 32, Fraud: 62, Harassment: 35 },
    { name: 'Jun', Stalking: 28, Fraud: 58, Harassment: 28 }
  ];

  const categoryData = [
    { name: 'Cyberstalking', count: 131, fill: '#ef4444' },
    { name: 'Financial Fraud', count: 289, fill: '#3b82f6' },
    { name: 'Online Harassment', count: 182, fill: '#a855f7' },
    { name: 'Identity Theft', count: 94, fill: '#f59e0b' },
    { name: 'Deepfake Misuse', count: 68, fill: '#ec4899' }
  ];

  const responseTimeData = [
    { day: 'Mon', time: 5.2 },
    { day: 'Tue', time: 4.8 },
    { day: 'Wed', time: 4.2 },
    { day: 'Thu', time: 3.9 },
    { day: 'Fri', time: 3.7 },
    { day: 'Sat', time: 3.5 },
    { day: 'Sun', time: 3.2 }
  ];

  const COLORS = ['#ef4444', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Analytics Deck</h2>
          <p className="text-xs text-slate-500 mt-1">
             Ahmedabad Cyber Cell crime trends and dispatch performance indicators
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Crime Type distributions (Bar Chart - 6 Columns) */}
        <div className="col-span-6 bg-dark-card border border-slate-900 rounded-xl p-5 flex flex-col h-80">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-4">Total Incidents by Category</span>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tickLine={false} tick={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121824', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents Over Time (Line Chart - 6 Columns) */}
        <div className="col-span-6 bg-dark-card border border-slate-900 rounded-xl p-5 flex flex-col h-80">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-4">Chronological Crime Progression</span>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tickLine={false} tick={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121824', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Line type="monotone" dataKey="Stalking" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Fraud" stroke="#3b82f6" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Harassment" stroke="#a855f7" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dispatch Response Times (Area Chart - 7 Columns) */}
        <div className="col-span-7 bg-dark-card border border-slate-900 rounded-xl p-5 flex flex-col h-80">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-4">PCR Response Time Trend (Minutes)</span>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseTimeData}>
                <XAxis dataKey="day" stroke="#64748b" tickLine={false} tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tickLine={false} tick={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121824', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTime)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution (Pie Chart - 5 Columns) */}
        <div className="col-span-5 bg-dark-card border border-slate-900 rounded-xl p-5 flex flex-col h-80">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-4">Category Distribution Share</span>
          <div className="flex-1 w-full text-xs flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121824', borderColor: '#1e293b', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center font-display">
              <span className="text-xl font-extrabold text-white">744</span>
              <span className="text-[8.5px] text-slate-550 uppercase tracking-widest font-sans font-bold">Total Cases</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
