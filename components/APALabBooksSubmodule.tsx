import React, { useState, useMemo, useEffect } from 'react';
import { Book, Reader, Loan } from '../types';
import { supabase } from '../supabaseClient';
import {
  BookOpen, Search, Plus, Trash2, Edit3, X, Loader2, BookMarked, BrainCircuit, Bookmark
} from 'lucide-react';
import { suggestBooks, fetchBookSynopsis, fetchBookCover } from '../geminiService';

export const APALabBooksSubmodule: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form state
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    category: 'Laboratório APA',
    isbn: '',
    totalCopies: 1,
    availableCopies: 1,
    location: 'Laboratório APA',
    internalRegistration: '',
    registrationDate: new Date().toISOString().split('T')[0],
    bookType: 'LIVRO',
    colorTag: 'VERDE',
    coverUrl: '',
    synopsis: ''
  });

  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('library_books')
        .select('*')
        .eq('category', 'Laboratório APA')
        .order('title');
      
      if (error) throw error;

      if (data) {
        const mappedBooks: Book[] = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          isbn: b.isbn || undefined,
          totalCopies: b.total_copies,
          availableCopies: b.available_copies,
          location: b.location,
          internalRegistration: b.internal_registration,
          registrationDate: b.registration_date,
          bookType: b.book_type,
          volumeNumber: b.volume_number || undefined,
          subtitle: b.subtitle || undefined,
          colorTag: b.color_tag,
          coverUrl: b.cover_url || undefined,
          synopsis: b.synopsis || undefined
        }));
        setBooks(mappedBooks);
      }
    } catch (error) {
      console.error('Erro ao carregar livros do APA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.internalRegistration) {
      alert('Por favor, preencha os campos obrigatórios (Título, Autor e Tombo).');
      return;
    }

    try {
      const bookData = {
        title: newBook.title,
        author: newBook.author,
        category: 'Laboratório APA',
        isbn: newBook.isbn || null,
        total_copies: newBook.totalCopies || 1,
        available_copies: newBook.availableCopies || 1,
        location: newBook.location || 'Laboratório APA',
        internal_registration: newBook.internalRegistration,
        registration_date: newBook.registrationDate || new Date().toISOString().split('T')[0],
        book_type: newBook.bookType || 'LIVRO',
        volume_number: newBook.volumeNumber || null,
        subtitle: newBook.subtitle || null,
        color_tag: newBook.colorTag || 'VERDE',
        cover_url: newBook.coverUrl || null,
        synopsis: newBook.synopsis || null
      };

      if (editingBook) {
        const { error } = await supabase
          .from('library_books')
          .update(bookData)
          .eq('id', editingBook.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('library_books')
          .insert([bookData]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingBook(null);
      setNewBook({
        title: '',
        author: '',
        category: 'Laboratório APA',
        isbn: '',
        totalCopies: 1,
        availableCopies: 1,
        location: 'Laboratório APA',
        internalRegistration: '',
        registrationDate: new Date().toISOString().split('T')[0],
        bookType: 'LIVRO',
        colorTag: 'VERDE',
        coverUrl: '',
        synopsis: ''
      });
      loadBooks();
    } catch (error) {
      console.error('Erro ao salvar livro:', error);
      alert('Erro ao salvar o livro. Tente novamente.');
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este livro do laboratório APA?')) {
      try {
        const { error } = await supabase
          .from('library_books')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        loadBooks();
      } catch (error) {
        console.error('Erro ao excluir livro:', error);
        alert('Erro ao excluir o livro. Pode haver empréstimos vinculados.');
      }
    }
  };

  const handleFetchAiInfo = async () => {
    if (!newBook.title) return;
    setAiLoading(true);
    try {
      const query = `${newBook.title} ${newBook.author || ''}`.trim();
      const [synopsis, coverUrl] = await Promise.all([
        fetchBookSynopsis(newBook.title, newBook.author || ''),
        fetchBookCover(newBook.title, newBook.author || '', newBook.isbn)
      ]);
      
      setNewBook(prev => ({
        ...prev,
        synopsis: synopsis || prev.synopsis,
        coverUrl: coverUrl || prev.coverUrl
      }));
    } catch (error) {
      console.error('Erro ao buscar info com IA:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    const lower = searchTerm.toLowerCase();
    return books.filter(b => 
      b.title.toLowerCase().includes(lower) || 
      b.author.toLowerCase().includes(lower) ||
      b.internalRegistration.toLowerCase().includes(lower)
    );
  }, [books, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase flex items-center gap-2">
            <BookMarked className="text-emerald-500" />
            Acervo Laboratório APA
          </h2>
          <p className="text-sm text-gray-500 font-medium">Controle exclusivo de livros do Laboratório de Aprendizagem</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar livro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
          <button
            onClick={() => {
              setEditingBook(null);
              setNewBook({
                title: '',
                author: '',
                category: 'Laboratório APA',
                isbn: '',
                totalCopies: 1,
                availableCopies: 1,
                location: 'Laboratório APA',
                internalRegistration: '',
                registrationDate: new Date().toISOString().split('T')[0],
                bookType: 'LIVRO',
                colorTag: 'VERDE',
                coverUrl: '',
                synopsis: ''
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            Novo Livro APA
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="font-bold uppercase tracking-widest text-sm">Carregando Acervo APA...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col">
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-200">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Bookmark size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-900 uppercase text-sm leading-tight mb-1">{book.title}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase">{book.author}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded inline-block">Tombo: {book.internalRegistration}</p>
                    <p className="text-[10px] font-bold text-gray-400">Cópias: {book.availableCopies} / {book.totalCopies}</p>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingBook(book);
                    setNewBook(book);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteBook(book.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {filteredBooks.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum livro encontrado no Laboratório APA</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center shrink-0">
              <h3 className="font-black uppercase tracking-wider flex items-center gap-2">
                {editingBook ? <Edit3 size={20} /> : <Plus size={20} />}
                {editingBook ? 'Editar Livro APA' : 'Novo Livro APA'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">Título *</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={e => setNewBook({...newBook, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="TÍTULO DO LIVRO"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">Autor *</label>
                  <input
                    type="text"
                    value={newBook.author}
                    onChange={e => setNewBook({...newBook, author: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="AUTOR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">Nº Tombo *</label>
                  <input
                    type="text"
                    value={newBook.internalRegistration}
                    onChange={e => setNewBook({...newBook, internalRegistration: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="EX: 1234"
                  />
                </div>

                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={handleFetchAiInfo}
                    disabled={aiLoading || !newBook.title}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                    Auto-preencher com IA (Capa/Sinopse)
                  </button>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">URL da Capa (Opcional)</label>
                  <input
                    type="text"
                    value={newBook.coverUrl || ''}
                    onChange={e => setNewBook({...newBook, coverUrl: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">Sinopse (Opcional)</label>
                  <textarea
                    value={newBook.synopsis || ''}
                    onChange={e => setNewBook({...newBook, synopsis: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                    placeholder="Resumo do livro..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-200 rounded-xl transition-colors uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBook}
                className="px-6 py-2.5 bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 uppercase tracking-wider flex items-center gap-2"
              >
                Salvar Livro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
