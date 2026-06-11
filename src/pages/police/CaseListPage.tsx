import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, FileText } from 'lucide-react';
import { useComplaints } from '../../data/store';

export default function CaseListPage() {
  const navigate = useNavigate();
  const complaints = useComplaints();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'assigned': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'investigating': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'resolved': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      default: return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  const getPriorityStyle = (priority: string) => {
    return priority === 'urgent'
      ? 'text-brand-red border-red-500/20 bg-red-500/5'
      : 'text-slate-400 border-slate-800 bg-slate-900/40';
  };

  // Filter complaints
  const filteredCases = complaints.filter((comp) => {
    const matchesSearch = comp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || comp.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || comp.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Cyber Complaints Queue</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review forensic evidence hashes, audit access controls, and assign cases
          </p>
        </div>
      </div>

      {/* Filters Control Deck */}
      <div className="bg-dark-card border border-slate-900 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by Case ID, category, suspect..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-900 focus:border-brand-red rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none transition-colors"
          />
        </div>

        {/* Filters options */}
        <div className="flex gap-3 text-xs">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-900 rounded-lg py-2 px-2.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-900 rounded-lg py-2 px-2.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Case Table Panel */}
      <div className="bg-dark-card border border-slate-900 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-900 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4">Case ID</th>
              <th className="p-4">Category</th>
              <th className="p-4">Registered Date</th>
              <th className="p-4">Status</th>
              <th className="p-4">Priority</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60 text-slate-300">
            {filteredCases.map((c) => (
              <tr 
                key={c.id}
                onClick={() => navigate(`/police/cases/${c.id}`)}
                className="hover:bg-slate-900/10 transition-colors cursor-pointer"
              >
                <td className="p-4 font-mono font-bold text-brand-red">{c.id}</td>
                <td className="p-4 capitalize font-semibold">{c.category.replace('_', ' ')}</td>
                <td className="p-4 text-slate-450 font-medium">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getPriorityStyle(c.priority)}`}>
                    {c.priority}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/police/cases/${c.id}`);
                    }}
                    className="p-1 rounded bg-slate-950 border border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCases.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-655 mx-auto mb-2" />
            <p className="text-slate-500">No cases matched the selected search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
