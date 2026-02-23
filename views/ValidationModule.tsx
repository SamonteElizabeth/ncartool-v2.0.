import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NCAR, ActionPlan, NCARStatus, Role } from '../types';
import { 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  User, 
  Calendar, 
  Eye, 
  Search, 
  FileIcon, 
  Filter, 
  Check,
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  X,
  ClipboardList,
  ArrowRightCircle,
  Clock,
  PlusCircle,
  RefreshCcw,
  Send,
  FileUp,
  Eraser,
  Undo2,
  ArrowRight
} from 'lucide-react';

interface ValidationModuleProps {
  ncars: NCAR[];
  actionPlans: ActionPlan[];
  setNcars: React.Dispatch<React.SetStateAction<NCAR[]>>;
  setActionPlans?: React.Dispatch<React.SetStateAction<ActionPlan[]>>;
  role: Role;
  onNotify: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

const ValidationModule: React.FC<ValidationModuleProps> = ({ ncars, actionPlans, setNcars, setActionPlans, role, onNotify }) => {
  const [viewingNCARId, setViewingNCARId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');

  const [isCreatingActionPlan, setIsCreatingActionPlan] = useState(false);
  
  const initialApFormData = {
    correction: '',
    rootCause: '',
    actionPlan: '',
    responsible: 'Bob Johnson',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachmentName: ''
  };

  const [apFormData, setApFormData] = useState(initialApFormData);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);

  const isLead = role === 'LEAD_AUDITOR';
  const isAuditee = role === 'AUDITEE';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (viewingNCARId) {
      const existing = actionPlans.find(ap => ap.ncarId === viewingNCARId);
      if (existing) {
        setApFormData({
          correction: existing.immediateCorrection,
          rootCause: existing.rootCause,
          actionPlan: existing.correctiveAction,
          responsible: existing.responsiblePerson,
          dueDate: existing.dueDate,
          attachmentName: existing.remarks || ''
        });
      } else {
        setApFormData(initialApFormData);
      }
    }
  }, [viewingNCARId, actionPlans]);

  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const getDaysRemaining = (deadline: string) => {
    const d = new Date(deadline);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const filteredItems = useMemo(() => {
    return ncars.filter(ncar => {
      const isValidatable = 
        ncar.status === NCARStatus.ACTION_PLAN_SUBMITTED || 
        ncar.status === NCARStatus.CLOSED || 
        ncar.status === NCARStatus.REOPENED ||
        ncar.status === NCARStatus.REJECTED;

      if (!isValidatable) return false;

      const matchesSearch = 
        ncar.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ncar.requirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ncar.area.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = false;
      if (statusFilter === 'All') {
        matchesStatus = true;
      } else if (statusFilter === 'Pending') {
        matchesStatus = ncar.status === NCARStatus.ACTION_PLAN_SUBMITTED;
      } else if (statusFilter === 'Approved') {
        matchesStatus = ncar.status === NCARStatus.CLOSED || ncar.status === NCARStatus.VALIDATED;
      } else if (statusFilter === 'Rejected') {
        matchesStatus = ncar.status === NCARStatus.REOPENED || ncar.status === NCARStatus.REJECTED;
      }

      const matchesType = 
        typeFilters.length === 0 || 
        typeFilters.includes(ncar.findingType);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [ncars, searchQuery, statusFilter, typeFilters]);

  const handleApprove = (id: string) => {
    if (!isLead) return;
    setNcars(prev => prev.map(n => n.id === id ? { ...n, status: NCARStatus.CLOSED, rejectionRemarks: undefined } : n));
    onNotify(`NCAR ${id} Verified & Closed.`, 'success');
    setViewingNCARId(null);
  };

  const finalizeRejection = () => {
    if (!viewingNCARId || !rejectionRemarks.trim()) return;
    setNcars(prev => prev.map(n => n.id === viewingNCARId ? { ...n, status: NCARStatus.REOPENED, rejectionRemarks: rejectionRemarks } : n));
    onNotify(`NCAR ${viewingNCARId} Reopened: ${rejectionRemarks}`, 'warning');
    setViewingNCARId(null);
    setShowRejectModal(false);
    setRejectionRemarks('');
  };

  const handleAuditeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingNCARId || !setActionPlans) return;

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newAP: ActionPlan = {
      id: `ACT_VAL_${String(actionPlans.length + 1).padStart(4, '0')}_${timestamp}`,
      ncarId: viewingNCARId,
      immediateCorrection: apFormData.correction,
      responsiblePerson: apFormData.responsible,
      rootCause: apFormData.rootCause,
      correctiveAction: apFormData.actionPlan,
      dueDate: apFormData.dueDate,
      submittedAt: now.toISOString(),
      remarks: apFormData.attachmentName
    };

    setActionPlans(prev => [...prev.filter(ap => ap.ncarId !== viewingNCARId), newAP]);
    setNcars(prev => prev.map(n => n.id === viewingNCARId ? { ...n, status: NCARStatus.ACTION_PLAN_SUBMITTED, rejectionRemarks: undefined } : n));

    onNotify(`Action Plan for ${viewingNCARId} resubmitted successfully.`, 'success');
    handleCloseModal();
  };

  const initiateFreshPlan = () => {
    setApFormData(initialApFormData);
    setIsCreatingActionPlan(true);
    onNotify("Started a fresh revision draft.", "info");
  };

  const handleCloseModal = () => {
    setViewingNCARId(null);
    setIsCreatingActionPlan(false);
    setApFormData(initialApFormData);
  };

  const pendingCount = ncars.filter(n => n.status === NCARStatus.ACTION_PLAN_SUBMITTED).length;

  return (
    <div className="space-y-10 text-base relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-4xl font-black text-gray-900 tracking-tight">Validation & Closure</h3>
        </div>
        <div className="bg-blue-50 px-8 py-4 rounded-2xl border border-blue-100 flex items-center gap-4">
          <div className="w-4 h-4 bg-[#3b82f6] rounded-full animate-pulse"></div>
          <span className="text-base font-black text-blue-700 uppercase tracking-widest">{pendingCount} Review(s) Requested</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by NCAR ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-base font-medium"
          />
        </div>
        <div className="flex gap-3 relative" ref={filterRef}>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-3 px-7 py-4 rounded-2xl text-base font-black transition-all border-2 ${typeFilters.length > 0 || showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}>
            <Filter size={20} /> Filters
          </button>
          {showFilters && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 z-40">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Finding Types</span>
              {['Major', 'Minor', 'OFI'].map(type => (
                <label key={type} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm font-bold text-gray-700">{type}</span>
                  <input type="checkbox" checked={typeFilters.includes(type)} onChange={() => toggleTypeFilter(type)} className="w-4 h-4 rounded text-blue-600" />
                </label>
              ))}
            </div>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-50 border-none rounded-2xl px-7 py-4 text-base font-black text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#3b82f6] text-white">
                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest">NCAR ID</th>
                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest">Finding Type</th>
                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest">Requirement</th>
                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-center">Deadline</th>
                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-black uppercase tracking-widest italic opacity-60">No items found</td></tr>
              ) : (
                filteredItems.map(n => (
                  <tr key={n.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-8 py-6"><span className="text-[12px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{n.id}</span></td>
                    <td className="px-8 py-6"><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${n.findingType === 'Major' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{n.findingType}</span></td>
                    <td className="px-8 py-6 font-bold text-gray-700 text-sm line-clamp-1">{n.requirement}</td>
                    <td className="px-8 py-6 text-center">
                      <div className="text-[12px] font-black text-gray-900">{new Date(n.deadline).toLocaleDateString()}</div>
                      <div className="text-[9px] font-black text-blue-500 uppercase mt-1">{getDaysRemaining(n.deadline)} days left</div>
                    </td>
                    <td className="px-8 py-6 text-center"><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${n.status === NCARStatus.CLOSED ? 'bg-green-50 text-green-600 border-green-100' : n.status === NCARStatus.REOPENED ? 'bg-red-50 text-red-600 border-red-100' : n.status === NCARStatus.ACTION_PLAN_SUBMITTED ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{n.status === NCARStatus.CLOSED ? 'Approved' : (n.status === NCARStatus.REOPENED ? 'Rejected' : (n.status === NCARStatus.ACTION_PLAN_SUBMITTED ? 'Review Required' : n.status))}</span></td>
                    <td className="px-8 py-6 text-center"><button onClick={() => setViewingNCARId(n.id)} className={`p-3 rounded-2xl transition-all border ${isAuditee && (n.status === NCARStatus.REOPENED || n.status === NCARStatus.REJECTED) ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' : 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-600 hover:text-white'}`}>{isAuditee && (n.status === NCARStatus.REOPENED || n.status === NCARStatus.REJECTED) ? <RefreshCcw size={20} /> : <Eye size={20} />}</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingNCARId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {(() => {
              const n = ncars.find(nc => nc.id === viewingNCARId);
              if (!n) return null;
              
              return (
                <>
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-3xl text-white shadow-xl ${isCreatingActionPlan ? 'bg-[#3b82f6]' : (n.status === NCARStatus.REOPENED ? 'bg-red-600' : 'bg-[#3b82f6]')}`}>
                        {isCreatingActionPlan ? <RefreshCcw size={32} /> : <ShieldCheck size={32} />}
                      </div>
                      <div>
                        <h4 className="text-3xl font-black text-gray-900 tracking-tight">{isCreatingActionPlan ? 'Revise Action Plan' : 'Validation Detail'}</h4>
                        <p className="text-sm font-bold text-gray-400 mt-1">Ref ID: {n.id}</p>
                      </div>
                    </div>
                    <button onClick={handleCloseModal} className="p-3 text-gray-400 hover:text-gray-900 bg-white rounded-full border border-gray-100 transition-all"><X size={24} /></button>
                  </div>

                  {!isCreatingActionPlan ? (
                    <>
                      <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-8">
                          {n.rejectionRemarks && (
                            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex items-start gap-5 shadow-sm">
                              <AlertTriangle className="text-red-600 mt-1 flex-shrink-0" size={24} />
                              <div>
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-1">Feedback from Lead Auditor</span>
                                <p className="text-base font-bold text-red-900 italic">"{n.rejectionRemarks}"</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-xs border-b-2 border-blue-100 pb-3"><ClipboardList size={18} /> Finding Analysis</div>
                          <div className="space-y-6">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Statement</label><div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-base text-gray-700 italic">"{n.statement}"</div></div>
                            <div className="grid grid-cols-2 gap-6">
                              <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Finding Type</label><span className="text-sm font-black text-gray-900 uppercase bg-white border-2 border-gray-100 px-4 py-2 rounded-xl block">{n.findingType}</span></div>
                              <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Requirement</label><span className="text-sm font-black text-gray-900 uppercase bg-white border-2 border-gray-100 px-4 py-2 rounded-xl block">{n.requirement}</span></div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="flex items-center gap-3 text-green-600 font-black uppercase text-xs border-b-2 border-green-100 pb-3"><CheckCircle2 size={18} /> Plan Analysis</div>
                          <div className="space-y-6">
                            {actionPlans.find(ap => ap.ncarId === viewingNCARId) ? (
                              <>
                                <div><label className="text-[10px] font-black text-gray-400 block mb-2">Root Cause</label><div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 text-sm font-bold text-gray-800">{apFormData.rootCause || 'N/A'}</div></div>
                                <div><label className="text-[10px] font-black text-gray-400 block mb-2">Corrective Strategy</label><div className="bg-green-50/30 p-6 rounded-3xl border border-green-100 text-base text-gray-900 font-black">{apFormData.actionPlan || 'N/A'}</div></div>
                                <div className="flex items-center gap-4 pt-4">
                                  <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Auditee</label><div className="flex items-center gap-2 text-xs font-black text-gray-800"><User size={14} className="text-blue-500" /> {apFormData.responsible}</div></div>
                                  <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Date</label><div className="flex items-center gap-2 text-xs font-black text-gray-800"><Calendar size={14} className="text-blue-500" /> {apFormData.dueDate}</div></div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full py-20 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200"><Clock size={48} className="text-gray-300 mb-4" /><p className="text-gray-400 font-black uppercase text-xs tracking-widest">Awaiting Plan</p></div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div className="text-xs font-bold text-gray-400">Audit Ref: <span className="text-blue-500 font-black">{n.auditPlanId}</span></div>
                        <div className="flex gap-4">
                          {isLead && n.status === NCARStatus.ACTION_PLAN_SUBMITTED && (
                            <><button onClick={() => setShowRejectModal(true)} className="flex items-center gap-2 px-10 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black hover:bg-red-50 transition-all uppercase text-xs tracking-widest shadow-lg shadow-red-50"><XCircle size={18} /> Request Revision</button><button onClick={() => handleApprove(n.id)} className="flex items-center gap-2 px-12 py-4 bg-[#3b82f6] text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl uppercase text-xs tracking-widest"><CheckCircle2 size={18} /> Final Closure</button></>
                          )}
                          {isAuditee && (n.status === NCARStatus.REOPENED || n.status === NCARStatus.REJECTED) && (
                            <div className="flex gap-4">
                              <button onClick={initiateFreshPlan} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl font-black hover:bg-blue-50 transition-all uppercase text-xs tracking-widest shadow-lg shadow-blue-50"><PlusCircle size={20} /> Create New Plan</button>
                              <button onClick={() => setIsCreatingActionPlan(true)} className="flex items-center gap-3 px-10 py-4 bg-[#3b82f6] text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl uppercase text-xs tracking-widest"><RefreshCcw size={20} /> Edit Previous Plan</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleAuditeeSubmit}>
                      <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                         <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 flex items-start gap-4">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><AlertCircle size={20} /></div>
                            <div><span className="text-[10px] font-black text-blue-400 uppercase block mb-1">NCAR Finding Statement</span><p className="text-sm font-bold text-gray-800 italic leading-relaxed">"{n.statement}"</p></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Immediate Correction (Containment)</label><textarea required value={apFormData.correction} onChange={(e) => setApFormData({...apFormData, correction: e.target.value})} placeholder="Steps taken immediately..." className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all min-h-[100px]" /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Root Cause Analysis (RCA)</label><textarea required value={apFormData.rootCause} onChange={(e) => setApFormData({...apFormData, rootCause: e.target.value})} placeholder="Systemic failures identified..." className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all min-h-[140px]" /></div>
                            </div>
                            <div className="space-y-6">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Long-term Corrective Action</label><textarea required value={apFormData.actionPlan} onChange={(e) => setApFormData({...apFormData, actionPlan: e.target.value})} placeholder="Strategy to prevent recurrence..." className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all min-h-[100px]" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Assignee</label><input required type="text" value={apFormData.responsible} onChange={(e) => setApFormData({...apFormData, responsible: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold" /></div>
                                  <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Target Date</label><input required type="date" value={apFormData.dueDate} onChange={(e) => setApFormData({...apFormData, dueDate: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold" /></div>
                                </div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Evidence Artifacts</label><input type="file" id="revision-file-val" className="hidden" onChange={(e) => e.target.files && setApFormData({...apFormData, attachmentName: e.target.files[0].name})} /><label htmlFor="revision-file-val" className="w-full border-2 border-dashed border-blue-200 rounded-2xl p-6 bg-blue-50/30 flex items-center justify-center gap-4 cursor-pointer hover:bg-blue-100/30 transition-all shadow-sm"><FileUp size={24} className="text-blue-500" /><div className="text-left"><p className="text-[10px] font-black text-blue-900 uppercase truncate">{apFormData.attachmentName || 'Upload evidence artifacts'}</p><p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest mt-1">Proof of Implementation</p></div></label></div>
                            </div>
                         </div>
                      </div>

                      <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <button type="button" onClick={() => setApFormData(initialApFormData)} className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-gray-100 text-gray-400 hover:text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"><Eraser size={18} /> Reset Form</button>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setIsCreatingActionPlan(false)} className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-50 transition-all uppercase text-[10px] tracking-widest shadow-sm"><Undo2 size={18} /> Back</button>
                          <button type="submit" className="flex items-center gap-3 px-10 py-4 bg-[#3b82f6] text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl transition-all uppercase text-[10px] tracking-widest"><Send size={18} /> Resubmit for Validation</button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-red-50">
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-5"><div className="p-4 bg-red-50 rounded-3xl text-red-600"><AlertTriangle size={36} /></div><div><h4 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Rejection Log</h4><p className="text-[10px] font-black text-gray-400 tracking-widest mt-1">Ref: {viewingNCARId}</p></div></div>
              <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><MessageSquare size={14} className="text-red-500" /> Rejection Reason (Required)</label><textarea autoFocus required value={rejectionRemarks} onChange={(e) => setRejectionRemarks(e.target.value)} placeholder="Clearly explain the shortcomings..." className="w-full bg-red-50/10 border-2 border-red-50 rounded-2xl p-6 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-red-100 transition-all min-h-[160px] resize-none" /></div>
              <div className="flex gap-4"><button onClick={() => { setShowRejectModal(false); setRejectionRemarks(''); }} className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase hover:bg-gray-100 transition-all text-sm uppercase tracking-widest">Cancel</button><button onClick={finalizeRejection} disabled={!rejectionRemarks.trim()} className="flex-[1.5] px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"><AlertCircle size={18} /> Confirm Rejection</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationModule;