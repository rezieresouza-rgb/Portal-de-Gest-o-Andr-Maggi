
import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Users,
  ArrowLeft,
  Search,
  Plus,
  History,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  ChevronRight,
  Bookmark,
  Calendar,
  AlertTriangle,
  Loader2,
  X,
  MapPin,
  Library,
  Trash2,
  Edit3,
  UserPlus,
  BookMarked,
  Filter,
  BellRing,
  AlertCircle,
  Maximize2,
  Mail,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { Book, Reader, Loan, StaffMember } from '../types';
import { suggestBooks } from '../geminiService';
import { INITIAL_STUDENTS } from '../constants/initialData';
import { supabase } from '../supabaseClient';

const LibraryModule: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'loans' | 'readers' | 'ai'>('dashboard');

  /*
   * MIGRAÇÃO SUPABASE: Biblioteca
   */
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  const fetchData = async () => {
    try {
      // 1. Fetch Books
      const { data: booksData } = await supabase
        .from('library_books')
        .select('*')
        .order('title');

      if (booksData) {
        setBooks(booksData.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          isbn: b.isbn,
          totalCopies: b.total_copies,
          availableCopies: b.available_copies,
          location: b.location
        })));
      }

      // 2. Fetch Readers
      const { data: readersData } = await supabase
        .from('library_readers')
        .select('*')
        .order('name');

      if (readersData) {
        setReaders(readersData.map(r => ({
          id: r.id,
          name: r.name,
          registration: r.registration,
          class: r.class_info,
          type: r.type
        })));
      }

      // 3. Fetch Loans
      const { data: loansData } = await supabase
        .from('library_loans')
        .select(`
          *,
          library_books (title),
          library_readers (name)
        `)
        .order('loan_date', { ascending: false });

      if (loansData) {
        setLoans(loansData.map(l => ({
          id: l.id,
          bookId: l.book_id,
          bookTitle: l.library_books?.title || 'Livro Removido',
          readerId: l.reader_id,
          readerName: l.library_readers?.name || 'Leitor Removido',
          loanDate: l.loan_date,
          dueDate: l.due_date,
          returnDate: l.return_date,
          status: l.status as any
        })));
      }

    } catch (error) {
      console.error("Erro ao buscar dados da biblioteca:", error);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime subscriptions can be added here if needed
    // For simplicity, we refresh on actions
  }, []);

  // BASE GLOBAL DA ESCOLA (Secretaria)
  const [globalSchoolPeople, setGlobalSchoolPeople] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [interests, setInterests] = useState('');

  // Modais
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '', author: '', category: 'Literatura Brasileira', isbn: '', totalCopies: 1, location: ''
  });

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedBookForLoan, setSelectedBookForLoan] = useState<Book | null>(null);
  const [loanForm, setLoanForm] = useState({
    readerId: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    readerSearch: ''
  });

  // Carrega base da secretaria para importação
  useEffect(() => {
    const loadSchoolPeople = () => {
      const savedStudents = localStorage.getItem('secretariat_detailed_students_v1');
      const students = savedStudents ? JSON.parse(savedStudents) : INITIAL_STUDENTS;

      const savedStaff = localStorage.getItem('secretariat_staff_v4');
      const staff = savedStaff ? JSON.parse(savedStaff) : [];

      const combined = [
        ...students.map((s: any) => ({
          id: s.CodigoAluno,
          name: s.Nome,
          type: 'ALUNO',
          sub: s.Turma,
          reg: s.CodigoAluno
        })),
        ...staff.map((s: StaffMember) => ({
          id: s.id,
          name: s.name,
          type: 'SERVIDOR',
          sub: s.jobFunction,
          reg: s.registration
        }))
      ];
      setGlobalSchoolPeople(combined);
    };
    loadSchoolPeople();
  }, [isImportModalOpen]);



  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const expiringSoon = loans.filter(l => l.status === 'ATIVO' && l.dueDate >= todayStr && l.dueDate <= new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
    const delayed = loans.filter(l => l.status === 'ATIVO' && l.dueDate < todayStr);

    return {
      totalBooks: books.reduce((acc, b) => acc + b.totalCopies, 0),
      activeLoans: loans.filter(l => l.status === 'ATIVO').length,
      delayedLoans: delayed.length,
      expiringSoon,
      totalReaders: readers.length,
      todayStr
    };
  }, [books, loans, readers]);

  const handleImportReader = async (person: any) => {
    if (readers.some(r => r.registration === person.reg)) {
      alert("Este leitor já está cadastrado na biblioteca.");
      return;
    }

    try {
      const { error } = await supabase.from('library_readers').insert([{
        name: person.name,
        registration: person.reg,
        type: person.type,
        class_info: person.sub
      }]);

      if (error) throw error;

      await fetchData();
      setIsImportModalOpen(false);
      setPeopleSearch('');
      alert(`${person.name} cadastrado como leitor!`);
    } catch (error) {
      console.error("Erro ao importar leitor:", error);
      alert("Erro ao importar leitor.");
    }
  };

  const saveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookData = {
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        location: bookForm.location,
        total_copies: bookForm.totalCopies,
        available_copies: editingBookId
          ? (books.find(b => b.id === editingBookId)?.availableCopies || 0) + (bookForm.totalCopies - (books.find(b => b.id === editingBookId)?.totalCopies || 0))
          : bookForm.totalCopies,
        isbn: bookForm.isbn
      };

      if (editingBookId) {
        // UPDATE
        const { error } = await supabase
          .from('library_books')
          .update(bookData)
          .eq('id', editingBookId);
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from('library_books')
          .insert([bookData]);
        if (error) throw error;
      }

      await fetchData();
      setIsBookModalOpen(false);
      alert("Obra salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar obra:", error);
      alert("Erro ao salvar obra.");
    }
  };

  const confirmLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const reader = readers.find(r => r.id === loanForm.readerId);
    if (!reader || !selectedBookForLoan) return alert('Selecione um leitor.');

    try {
      // 1. Create Loan
      const { error: loanError } = await supabase.from('library_loans').insert([{
        book_id: selectedBookForLoan.id,
        reader_id: reader.id,
        loan_date: new Date().toISOString().split('T')[0],
        due_date: loanForm.dueDate,
        status: 'ATIVO'
      }]);
      if (loanError) throw loanError;

      // 2. Decrement Available Copies
      const { error: bookError } = await supabase.rpc('decrement_book_copies', { book_id: selectedBookForLoan.id });
      // Fallback if RPC doesn't exist (basic update)
      if (bookError) {
        await supabase
          .from('library_books')
          .update({ available_copies: selectedBookForLoan.availableCopies - 1 })
          .eq('id', selectedBookForLoan.id);
      }

      await fetchData();
      setIsLoanModalOpen(false);
      setSelectedBookForLoan(null);
      alert("Empréstimo registrado!");
    } catch (error) {
      console.error("Erro ao registrar empréstimo:", error);
      alert("Erro ao registrar empréstimo.");
    }
  };

  const handleReturn = async (loan: Loan) => {
    if (!window.confirm("Confirmar devolução do livro?")) return;
    try {
      // 1. Update Loan
      const { error: loanError } = await supabase
        .from('library_loans')
        .update({
          status: 'DEVOLVIDO',
          return_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', loan.id);
      if (loanError) throw loanError;

      // 2. Increment Copies
      // We need to fetch the book to get current copies if we don't use RPC
      // But let's try a simple increment approach or just fetch fresh data
      const book = books.find(b => b.id === loan.bookId);
      if (book) {
        await supabase
          .from('library_books')
          .update({ available_copies: book.availableCopies + 1 })
          .eq('id', book.id);
      }

      await fetchData();
      alert("Devolução registrada!");
    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
      alert("Erro ao registrar devolução.");
    }
  };

  // FIX: Added missing handleSuggest function for AI book recommendations to fix error on line 411
  const handleSuggest = async () => {
    if (!interests.trim()) return alert('Informe os interesses ou temas para que o Bibliotecário IA possa sugerir obras.');
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const result = await suggestBooks(interests);
      setAiSuggestion(result || 'Nenhuma recomendação gerada pela IA neste momento.');
    } catch (error) {
      console.error('Erro ao consultar IA de livros:', error);
      setAiSuggestion('Ocorreu um erro ao processar a consulta com a IA. Tente novamente mais tarde.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredPeople = useMemo(() => {
    if (!peopleSearch || peopleSearch.length < 2) return [];
    return globalSchoolPeople.filter(p =>
      p.name.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      p.reg.includes(peopleSearch)
    ).slice(0, 10);
  }, [globalSchoolPeople, peopleSearch]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {stats.delayedLoans > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-red-600 text-white rounded-2xl animate-pulse"><AlertTriangle size={24} /></div>
                  <div>
                    <h3 className="text-lg font-black text-red-900 uppercase">Atrasos Críticos</h3>
                    <p className="text-red-700 text-xs font-bold uppercase">{stats.delayedLoans} Livros pendentes de devolução</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('loans')} className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Cobrar Leitores</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Obras no Acervo', value: stats.totalBooks, icon: BookOpen },
                { label: 'Empréstimos Ativos', value: stats.activeLoans, icon: Bookmark },
                { label: 'Vencendo em Breve', value: stats.expiringSoon.length, icon: Clock },
                { label: 'Leitores Registrados', value: stats.totalReaders, icon: Users },
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="p-3 w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-4 flex items-center justify-center"><card.icon size={24} /></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-8"><History className="text-indigo-600" size={20} /> Histórico Recente</h3>
                <div className="space-y-4">
                  {loans.slice(0, 6).map(l => (
                    <div key={l.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm shrink-0"><Bookmark size={18} /></div>
                        <div className="truncate">
                          <p className="text-xs font-black text-gray-900 uppercase truncate">{l.bookTitle}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{l.readerName}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${l.status === 'ATIVO' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{l.status}</span>
                    </div>
                  ))}
                  {loans.length === 0 && <p className="text-center py-10 text-gray-300 font-black uppercase text-xs">Nenhum registro</p>}
                </div>
              </div>

              <div className="bg-indigo-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><BrainCircuit size={140} /></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Bibliotecário IA</h3>
                  <p className="text-indigo-200 text-sm leading-relaxed mb-8 italic">"O índice de leitura do 9º Ano B aumentou 12% este mês. Sugiro destacar obras de Ficção Científica no mural de entrada."</p>
                </div>
                <button onClick={() => setActiveTab('ai')} className="relative z-10 w-full py-4 bg-white text-indigo-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-50 transition-all">Plano de Incentivo à Leitura</button>
              </div>
            </div>
          </div>
        );
      case 'catalog':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input type="text" placeholder="Pesquisar título ou autor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none" />
              </div>
              <button onClick={() => { setEditingBookId(null); setIsBookModalOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Plus size={16} /> Adicionar Obra</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(book => (
                <div key={book.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group flex flex-col h-full">
                  <div className="w-full aspect-[3/4] bg-indigo-50 rounded-2xl mb-4 flex items-center justify-center text-indigo-200 relative overflow-hidden">
                    <BookOpen size={48} />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-10 transition-opacity">
                      <button onClick={() => { setBookForm({ ...book }); setEditingBookId(book.id); setIsBookModalOpen(true); }} className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white"><Edit3 size={14} /></button>
                      <button onClick={() => { if (window.confirm("Apagar livro?")) setBooks(books.filter(b => b.id !== book.id)); }} className="p-2 bg-white text-red-600 rounded-lg shadow-sm hover:bg-red-600 hover:text-white"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-gray-900 uppercase leading-tight line-clamp-1">{book.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{book.author}</p>
                    <div className="mt-4 p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2"><MapPin size={12} className="text-indigo-500" /><span className="text-[9px] font-black text-gray-600 uppercase">{book.location}</span></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                    <p className={`text-xs font-black ${book.availableCopies > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{book.availableCopies} / {book.totalCopies} <span className="text-[8px] text-gray-400 uppercase">UN</span></p>
                    <button onClick={() => { setSelectedBookForLoan(book); setIsLoanModalOpen(true); }} disabled={book.availableCopies <= 0} className={`p-2.5 rounded-xl transition-all shadow-sm ${book.availableCopies > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}><Bookmark size={18} /></button>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                  <Library size={48} className="text-gray-200 mb-4" />
                  <p className="text-gray-400 font-black uppercase text-xs tracking-widest">O acervo está vazio. Comece a cadastrar as obras.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'readers':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input type="text" placeholder="Filtrar leitores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none" />
              </div>
              <button onClick={() => setIsImportModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><UserPlus size={16} /> Importar da Base Escolar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readers.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(reader => (
                <div key={reader.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col group hover:border-indigo-300 hover:shadow-lg transition-all relative">
                  <button onClick={() => setReaders(readers.filter(r => r.id !== reader.id))} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">{reader.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 uppercase truncate">{reader.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Mat: {reader.registration}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-2">
                    <GraduationCap size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{reader.class}</span>
                  </div>
                </div>
              ))}
              {readers.length === 0 && (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-white">
                  <Users size={48} className="mx-auto mb-4 text-gray-200" />
                  <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum leitor cadastrado. Use o botão acima para importar.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'loans':
        return (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Registro de Circulação</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase border border-blue-100">{stats.activeLoans} Ativos</span>
                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[9px] font-black uppercase border border-red-100">{stats.delayedLoans} Atrasados</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-8 py-5">Leitor / Aluno</th>
                    <th className="px-8 py-5">Obra / Exemplar</th>
                    <th className="px-8 py-5 text-center">Data Saída</th>
                    <th className="px-8 py-5 text-center">Vencimento</th>
                    <th className="px-8 py-5 text-right">Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900 uppercase">{loan.readerName}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">ID: {loan.readerId}</p>
                      </td>
                      <td className="px-8 py-6"><p className="font-bold text-indigo-600 uppercase leading-tight">{loan.bookTitle}</p></td>
                      <td className="px-8 py-6 text-center text-[10px] font-black text-gray-400">{new Date(loan.loanDate).toLocaleDateString('pt-BR')}</td>
                      <td className={`px-8 py-6 text-center font-black text-[10px] ${loan.status === 'ATIVO' && loan.dueDate < stats.todayStr ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>{new Date(loan.dueDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-8 py-6 text-right">
                        {loan.status === 'ATIVO' ? (
                          <button onClick={() => handleReturn(loan)} className="px-5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Confirmar Recebimento</button>
                        ) : (
                          <div className="flex flex-col items-end"><span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Devolvido</span><p className="text-[8px] text-gray-400 uppercase">{new Date(loan.returnDate!).toLocaleDateString('pt-BR')}</p></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-900 p-12 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Sparkles size={160} /></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-sm"><BrainCircuit size={32} className="text-indigo-400" /></div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Consultoria de Leitura</h2>
                </div>
                <p className="text-indigo-200 text-lg font-medium leading-relaxed max-w-2xl">O que o aluno gosta de ler? Digite temas para receber recomendações estratégicas e atrair novos leitores.</p>
                <div className="flex gap-4">
                  <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Ex: Astronomia, Fantasia medieval..." className="flex-1 px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white outline-none focus:bg-white/10 focus:border-indigo-400 transition-all font-bold placeholder:text-indigo-400" />
                  <button onClick={handleSuggest} disabled={aiLoading} className="px-10 py-5 bg-white text-indigo-900 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-3">{aiLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} Gerar Plano</button>
                </div>
              </div>
            </div>
            {aiSuggestion && (
              <div className="bg-white p-10 rounded-[3rem] border border-indigo-100 shadow-xl animate-in zoom-in-95 duration-500 prose prose-indigo max-w-none"><div className="flex items-center gap-3 text-indigo-600 mb-6 font-black uppercase text-xs tracking-[0.2em]"><CheckCircle2 size={18} /> Sugestões Estratégicas</div><div className="whitespace-pre-wrap text-gray-700 font-medium leading-relaxed">{aiSuggestion}</div></div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-64 bg-indigo-950 text-white flex flex-col no-print">
        <div className="p-6"><h1 className="text-xl font-bold flex items-center gap-2"><span className="bg-indigo-500 p-1.5 rounded-lg shadow-lg">📚</span>Biblioteca</h1></div>
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
            { id: 'catalog', label: 'Acervo Digital', icon: BookOpen },
            { id: 'loans', label: 'Empréstimos', icon: Clock },
            { id: 'readers', label: 'Leitores (School)', icon: Users },
            { id: 'ai', label: 'IA Consultor', icon: BrainCircuit },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-indigo-800 text-white shadow-lg' : 'text-indigo-100 hover:bg-indigo-800/50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-indigo-900 space-y-3">
          <button onClick={onExit} className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"><ArrowLeft size={16} /> Voltar</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen size={20} /></div><h2 className="text-sm font-black text-gray-900 uppercase">Biblioteca André Maggi</h2></div>
          <button onClick={toggleFullScreen} className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"><Maximize2 size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
        </div>
      </main>

      {/* MODAL IMPORTAÇÃO LEITOR (GLOBAL SEARCH) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-600/20"><UserPlus size={28} /></div>
                <div><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Vincular Leitor</h3><p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Busca Unificada: Alunos e Servidores</p></div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-3 bg-white text-gray-300 hover:text-red-500 rounded-2xl shadow-sm transition-all"><X size={24} /></button>
            </div>

            <div className="p-8 border-b border-gray-50 no-print">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input autoFocus type="text" placeholder="Digite o nome ou matrícula (mín. 2 letras)..." value={peopleSearch} onChange={e => setPeopleSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all uppercase" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-2">
                {filteredPeople.map(p => (
                  <button key={p.id} onClick={() => handleImportReader(p)} className="w-full text-left p-6 bg-white hover:bg-indigo-50 border border-gray-100 rounded-3xl transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${p.type === 'ALUNO' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{p.type[0]}</div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase group-hover:text-indigo-600">{p.name}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><UserCheck size={10} /> {p.type}</span>
                          <span className="flex items-center gap-1"><GraduationCap size={10} /> {p.sub}</span>
                          <span>MAT: {p.reg}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
                {peopleSearch.length >= 2 && filteredPeople.length === 0 && (
                  <div className="py-20 text-center opacity-30 font-black uppercase text-xs tracking-widest">Nenhuma pessoa encontrada</div>
                )}
                {peopleSearch.length < 2 && (
                  <div className="py-20 text-center flex flex-col items-center gap-4 opacity-10">
                    <Search size={64} />
                    <p className="font-black uppercase text-xs">Aguardando busca...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro Livro */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col">
            <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center"><h3 className="text-2xl font-black text-gray-900 uppercase">{editingBookId ? 'Editar Obra' : 'Nova Obra'}</h3><button onClick={() => setIsBookModalOpen(false)}><X size={24} /></button></div>
            <form onSubmit={saveBook} className="p-10 space-y-6">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Título</label><input required value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Autor</label><input required value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Localização (Estante/Prat)</label><input required value={bookForm.location} onChange={e => setBookForm({ ...bookForm, location: e.target.value.toUpperCase() })} placeholder="EX: ESTANTE 01 - A" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Total Exemplares</label><input required type="number" min="1" value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Categoria</label><select value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white"><option>Literatura Brasileira</option><option>Infanto-Juvenil</option><option>Didático</option></select></div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Salvar Obra no Acervo</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Empréstimo */}
      {isLoanModalOpen && selectedBookForLoan && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl border border-white/20 overflow-hidden flex flex-col">
            <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center"><div className="flex items-center gap-4"><div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><BookMarked size={24} /></div><div><h3 className="text-xl font-black text-gray-900 uppercase">Check-out</h3><p className="text-[9px] text-indigo-400 font-black uppercase mt-1">Registrar Empréstimo</p></div></div><button onClick={() => setIsLoanModalOpen(false)} className="p-2 text-gray-300 hover:text-red-500 transition-all"><X size={24} /></button></div>
            <form onSubmit={confirmLoan} className="p-10 space-y-6">
              <div className="bg-gray-900 p-6 rounded-[2rem] text-white relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen size={64} /></div><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Obra</p><h4 className="text-lg font-black uppercase leading-tight">{selectedBookForLoan.title}</h4></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localizar Leitor Cadastrado</label>
                <select required value={loanForm.readerId} onChange={e => setLoanForm({ ...loanForm, readerId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none uppercase">
                  <option value="">Selecione o leitor...</option>
                  {readers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.class})</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Devolução</label><input required type="date" value={loanForm.dueDate} onChange={e => setLoanForm({ ...loanForm, dueDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" /></div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Confirmar Empréstimo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryModule;
