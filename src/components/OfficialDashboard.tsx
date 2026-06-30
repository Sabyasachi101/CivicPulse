import React, { useEffect, useState } from 'react';
import { Issue, DEPARTMENTS_LIST, WARDS_LIST, CATEGORIES_LIST, STATE_CITY_WARD_MAP } from '../types';
import { 
  Building2, Filter, Download, UserPlus, FileText, CheckCircle, 
  AlertTriangle, Clock, ArrowRight, BookOpen, AlertCircle, Calendar 
} from 'lucide-react';

interface OfficialDashboardProps {
  currentUser: { uid: string; name: string; role: string } | null;
  issues: Issue[];
  onRefreshIssues?: () => void;
  onSelectIssue?: (issue: Issue) => void;
}

export default function OfficialDashboard({ currentUser, issues, onRefreshIssues, onSelectIssue }: OfficialDashboardProps) {
  // Filters
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');

  // Selected Issue for editing in detailed panel
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  
  // Status editing form state
  const [newStatus, setNewStatus] = useState<string>('');
  const [officialNote, setOfficialNote] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [slaDays, setSlaDays] = useState<number>(3);
  const [resolvedProofUrl, setResolvedProofUrl] = useState<string>('');
  
  // Submitting state
  const [updating, setUpdating] = useState(false);

  // Cascading lists for filter options
  const availableStates = Object.keys(STATE_CITY_WARD_MAP);
  const availableCities = selectedState !== 'All' ? Object.keys(STATE_CITY_WARD_MAP[selectedState] || {}) : [];
  const availableWards = (selectedState !== 'All' && selectedCity !== 'All') ? (STATE_CITY_WARD_MAP[selectedState]?.[selectedCity] || []) : [];

  const handleStateChange = (stateVal: string) => {
    setSelectedState(stateVal);
    setSelectedCity('All');
    setSelectedWard('All');
  };

  const handleCityChange = (cityVal: string) => {
    setSelectedCity(cityVal);
    setSelectedWard('All');
  };

  // Filter issues list
  const filteredIssues = issues.filter(issue => {
    const wardStr = issue.location?.ward || "";
    const parts = wardStr.split(" - ");
    const issueState = parts[0] || "";
    const issueCity = parts[1] || "";
    const issueWard = parts[2] || "";

    if (selectedState !== 'All' && issueState !== selectedState) return false;
    if (selectedCity !== 'All' && issueCity !== selectedCity) return false;
    if (selectedWard !== 'All' && issueWard !== selectedWard) return false;

    if (selectedCategory !== 'All' && issue.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && issue.status !== selectedStatus) return false;
    if (selectedSeverity !== 'All' && issue.severity !== Number(selectedSeverity)) return false;
    return true;
  });

  // Automatically select status from selected editing issue
  useEffect(() => {
    if (editingIssue) {
      setNewStatus(editingIssue.status);
      setDepartment(editingIssue.department || DEPARTMENTS_LIST[0]);
      setAssignedTo(editingIssue.assignedTo || '');
      setResolvedProofUrl(editingIssue.resolvedProofUrl || '');
    }
  }, [editingIssue]);

  // Handle saving status updates
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;

    setUpdating(true);
    
    // Calculate SLA date ISO
    const slaDue = new Date();
    slaDue.setDate(slaDue.getDate() + Number(slaDays));

    const patchBody: any = {
      status: newStatus,
      changedBy: currentUser?.name || 'Municipal Supervisor',
      note: officialNote || `Status updated to ${newStatus}.`,
      department,
      assignedTo: assignedTo || 'Unassigned Field Engineer',
      slaDue: slaDue.toISOString()
    };

    // If marked as resolved, add a beautiful placeholder "after" photo if none specified
    if (newStatus === 'resolved' || newStatus === 'closed') {
      patchBody.resolvedProofUrl = resolvedProofUrl || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80';
    }

    try {
      const res = await fetch(`/api/issues/${editingIssue.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody)
      });

      if (res.ok) {
        setEditingIssue(null);
        setOfficialNote('');
        if (onRefreshIssues) onRefreshIssues();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Export CSV generator function
  const handleExportCSV = () => {
    if (filteredIssues.length === 0) return;

    const headers = ['ID', 'Title', 'Category', 'Severity', 'Status', 'Ward', 'Address', 'Latitude', 'Longitude', 'Source', 'Date Reported'];
    
    const rows = filteredIssues.map(i => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      i.severity,
      i.status,
      `"${i.location.ward}"`,
      `"${i.location.address.replace(/"/g, '""')}"`,
      i.location.lat,
      i.location.lng,
      i.source,
      new Date(i.createdAt).toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create blob and trigger file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CivicPulse_Issues_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Identify SLA breaches: status not resolved/closed, and slaDue is past
  const getSlaStatus = (issueItem: Issue) => {
    if (issueItem.status === 'resolved' || issueItem.status === 'closed') {
      return { label: 'Completed', color: 'text-green-600 bg-green-50' };
    }
    if (!issueItem.slaDue) {
      return { label: 'No SLA Set', color: 'text-slate-400 bg-slate-100' };
    }

    const isPast = new Date(issueItem.slaDue).getTime() < Date.now();
    if (isPast) {
      return { label: '⚠️ SLA BREACHED', color: 'text-red-600 bg-red-50 border border-red-200 animate-pulse font-extrabold' };
    }
    return { label: 'In Schedule', color: 'text-blue-600 bg-blue-50' };
  };

  if (!currentUser || currentUser.role !== 'official') {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center bg-white dark:bg-slate-900 max-w-lg mx-auto my-12">
        <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-sans font-semibold text-slate-800 dark:text-slate-200">Official Access Only</h3>
        <p className="text-sm text-slate-400 mt-1">
          This portal is protected and only accessible to municipal engineers and utility supervisors.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            Official Municipal Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Review citizen complaints, allocate departments, monitor service SLAs, and upload resolution proof files.
          </p>
        </div>

        {/* CSV export controls */}
        <button
          onClick={handleExportCSV}
          disabled={filteredIssues.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all self-start md:self-center disabled:bg-slate-300"
        >
          <Download className="w-4 h-4" />
          Export filtered to CSV
        </button>
      </div>

      {/* Grid Filters Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fadeIn">
        {/* State Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            State
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-700 dark:text-slate-250 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All States</option>
            {availableStates.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>

        {/* City Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={selectedState === 'All'}
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-700 dark:text-slate-250 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="All">All Cities</option>
            {availableCities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        </div>

        {/* Ward Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Ward Locality
          </label>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            disabled={selectedCity === 'All'}
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-700 dark:text-slate-250 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="All">All Wards</option>
            {availableWards.map(wd => <option key={wd} value={wd}>{wd}</option>)}
          </select>
        </div>

        {/* Category selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-700 dark:text-slate-250 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Status Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-700 dark:text-slate-250 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Severity selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Severity
          </label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-700 dark:text-slate-250 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Severities</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left is Filtered list, Right is edit panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Filtered issues list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Active Assigned Complaints ({filteredIssues.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredIssues.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 bg-white dark:bg-slate-900">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">No issues match the selected filter configuration.</p>
              </div>
            ) : (
              filteredIssues.map(issue => {
                const sla = getSlaStatus(issue);

                return (
                  <div
                    key={issue.id}
                    onClick={() => setEditingIssue(issue)}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] shadow-sm flex justify-between gap-4 items-center ${
                      editingIssue?.id === issue.id 
                        ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/35' 
                        : 'border-slate-150 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400 font-mono">
                          {issue.category}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-slate-400 font-semibold font-mono truncate max-w-[150px]">
                          {issue.location.ward}
                        </span>
                      </div>

                      <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-white truncate">
                        {issue.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-slate-450">
                        <span className={`px-2 py-0.5 rounded font-mono ${sla.color}`}>
                          {sla.label}
                        </span>
                        {issue.department && (
                          <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-1.5 py-0.5 rounded">
                            {issue.department}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-150 dark:border-red-900/35 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                        Priority {issue.priorityScore ? issue.priorityScore.toFixed(0) : (issue.severity * 2)}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 font-mono">
                        {new Date(issue.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Status Editor Panel */}
        <div className="space-y-6">
          {editingIssue ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-sans font-bold text-slate-850 dark:text-white text-base">Update Complaint Status</h3>
                <p className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[250px]">Modifying Subject: {editingIssue.title}</p>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                {/* Status dropdown */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">New Status Pipeline</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-slate-250 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="reported" className="bg-white dark:bg-slate-900 text-slate-800">Reported</option>
                    <option value="under_review" className="bg-white dark:bg-slate-900 text-slate-800">Under Review</option>
                    <option value="verified" className="bg-white dark:bg-slate-900 text-slate-800">Verified</option>
                    <option value="assigned" className="bg-white dark:bg-slate-900 text-slate-800">Assigned</option>
                    <option value="in_progress" className="bg-white dark:bg-slate-900 text-slate-800">In Progress</option>
                    <option value="resolved" className="bg-white dark:bg-slate-900 text-slate-800 font-bold text-green-600">Mark Resolved</option>
                    <option value="closed" className="bg-white dark:bg-slate-900 text-slate-800">Closed</option>
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Responsible Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-slate-250 focus:border-blue-500 focus:outline-none"
                  >
                    {DEPARTMENTS_LIST.map(dep => (
                      <option key={dep} value={dep} className="bg-white dark:bg-slate-900 text-slate-800">{dep}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned Person Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Assigned Inspector / Engineer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Line Engineer Ramesh"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* SLA Days Limit */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">SLA Deadline Days</label>
                  <select
                    value={slaDays}
                    onChange={(e) => setSlaDays(Number(e.target.value))}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-slate-250 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="1">1 Day (High Urgent)</option>
                    <option value="3">3 Days (Standard SLA)</option>
                    <option value="7">7 Days (General repair)</option>
                    <option value="14">14 Days (Complex PWD works)</option>
                  </select>
                </div>

                {/* If resolved status is picked, show after proof image url selector */}
                {(newStatus === 'resolved' || newStatus === 'closed') && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Resolution Proof Photo URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://images.unsplash.com/photo..."
                      value={resolvedProofUrl}
                      onChange={(e) => setResolvedProofUrl(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-850 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-[9px] text-slate-400">Loads a high-contrast resolved pavement visual by default.</p>
                  </div>
                )}

                {/* Official remarks comment log */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Official Remarks / Internal Note</label>
                  <textarea
                    rows={2}
                    placeholder="Provide details about the work allocation or repair completion..."
                    value={officialNote}
                    onChange={(e) => setOfficialNote(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingIssue(null)}
                    className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 rounded-xl shadow-md disabled:bg-slate-300"
                  >
                    {updating ? "Saving..." : "Save Status"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 bg-white dark:bg-slate-900/40">
              <UserPlus className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-semibold">Select a complaint from the active queue to allocate departments, set SLAs, or log remarks.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
