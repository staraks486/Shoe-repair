import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { Message, UserProfile } from '../types';
import PageHeader from '../components/PageHeader';
import { 
  Send, 
  Search, 
  MessageSquare, 
  Smile, 
  Paperclip, 
  User as UserIcon, 
  Check, 
  CheckCheck, 
  Clock, 
  Users, 
  Phone, 
  Video, 
  MoreVertical, 
  ArrowLeft,
  Briefcase,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Trash2,
  HelpCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

// Helper to format timestamps gracefully like WhatsApp
const formatMessageTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return format(date, 'h:mm a');
  } catch (err) {
    return '';
  }
};

const formatChatHeaderTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return format(date, 'MMM d, h:mm a');
  } catch (err) {
    return '';
  }
};

export default function Messaging() {
  const { 
    user, 
    userProfile, 
    profiles, 
    messages, 
    sendMessage, 
    markMessagesAsRead,
    stores,
    currentStoreId 
  } = useAppStore();

  const [activeChatId, setActiveChatId] = useState<string>('general');
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'groups' | 'direct'>('all');
  const [isMobileChatView, setIsMobileChatView] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark active chat messages as read on mount or when activeChatId / messages change
  useEffect(() => {
    if (activeChatId) {
      markMessagesAsRead(activeChatId);
    }
  }, [activeChatId, messages.length, markMessagesAsRead]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatId]);

  if (!user || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-[#FDFCFB]">
        <div className="w-16 h-16 bg-brand-bg/50 rounded-full flex items-center justify-center mb-4 text-brand-muted">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="font-display text-xl font-bold text-brand-dark mb-2 uppercase tracking-wide">Access Denied</h3>
        <p className="text-sm text-brand-muted max-w-sm">Please log in with your store credentials to access the internal messaging center.</p>
      </div>
    );
  }

  // List of pre-filled business quick replies for a shoe cobbler studio
  const quickReplies = [
    { id: 'qr_complete', text: "✅ Repair is completed and fully polished!", label: 'Complete', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'qr_parts', text: "📦 Checking inventory for required replacement soles/leather.", label: 'Check Stock', icon: Briefcase, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'qr_urgent', text: "⚡ Urgent: Assistance needed at the primary workbench!", label: 'Urgent Help', icon: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'qr_customer', text: "📢 Customer is waiting at the counter for pickup.", label: 'Customer Front', icon: UserIcon, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'qr_quality', text: "✨ Let's do a quick quality control review on ticket #", label: 'Quality Check', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' }
  ];

  // Mock some pre-set staff profiles in case database hasn't registered them yet
  const defaultStaffProfiles: UserProfile[] = [
    { uid: 'mock-staff-1', displayName: 'Anand (Senior Cobbler)', email: 'anand@shoecare.com', role: 'Staff', createdAt: '' },
    { uid: 'mock-staff-2', displayName: 'Kunal (Sales Lead)', email: 'kunal@shoecare.com', role: 'Staff', createdAt: '' },
    { uid: 'mock-staff-3', displayName: 'Ravi (Restoration Expert)', email: 'ravi@shoecare.com', role: 'Staff', createdAt: '' },
    { uid: 'mock-admin-1', displayName: 'Studio Manager', email: 'manager@shoecare.com', role: 'Admin', createdAt: '' }
  ];

  // Merge registered firebase profiles with mock fallbacks, avoiding duplicates
  const allProfiles = [...profiles];
  defaultStaffProfiles.forEach(fallback => {
    if (!allProfiles.some(p => p.uid === fallback.uid) && fallback.uid !== user.uid) {
      allProfiles.push(fallback);
    }
  });

  // Ensure current user is in the profiles list
  if (!allProfiles.some(p => p.uid === user.uid)) {
    allProfiles.push(userProfile);
  }

  // Group chats definitions
  const activeStoreName = stores.find(s => s.id === currentStoreId)?.storeName || 'Cordwainers Studio';
  const groupChats = [
    { id: 'general', name: '📢 General Studio Broadcast', isGroup: true, description: 'Store-wide team announcements and coordination', photoUrl: '' },
    { id: `store-${currentStoreId || 'default'}`, name: `🥾 ${activeStoreName} Room`, isGroup: true, description: `Official channel for active shift coordination`, photoUrl: '' }
  ];

  // Build list of active direct message conversations based on profiles
  const directChats = allProfiles
    .filter(p => p.uid !== user.uid)
    .map(p => {
      // Direct chatId pattern: alphabetical sorting of both uids
      const chatId = user.uid < p.uid ? `${user.uid}_${p.uid}` : `${p.uid}_${user.uid}`;
      return {
        id: chatId,
        name: p.displayName || p.email.split('@')[0],
        isGroup: false,
        profile: p,
        description: p.role || 'Staff Member',
        photoUrl: p.photoURL || ''
      };
    });

  // Combine groups and direct chats
  const conversations = [...groupChats, ...directChats];

  // Helper to count unread messages for a specific chat
  const getUnreadCount = (chatId: string) => {
    return messages.filter(
      m => m.chatId === chatId && m.senderId !== user.uid && (!m.readBy || !m.readBy.includes(user.uid))
    ).length;
  };

  // Helper to get the last message for a conversation
  const getLastMessage = (chatId: string) => {
    const chatMessages = messages.filter(m => m.chatId === chatId);
    if (chatMessages.length === 0) return null;
    return chatMessages[chatMessages.length - 1];
  };

  // Filter conversations based on selected tab and search query
  const filteredConversations = conversations.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          chat.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (selectedTab === 'groups') return chat.isGroup;
    if (selectedTab === 'direct') return !chat.isGroup;
    return true;
  });

  // Handle sending text
  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    const textToSend = inputText.trim();
    const imageToSend = selectedImage || undefined;
    
    setInputText('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
    
    await sendMessage(activeChatId, textToSend, imageToSend);
  };

  const handleQuickReply = async (text: string) => {
    await sendMessage(activeChatId, text);
  };

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsMobileChatView(true);
  };

  const activeChat = conversations.find(c => c.id === activeChatId);
  const activeChatMessages = messages.filter(m => m.chatId === activeChatId);

  // Mock pre-set image attachments for artisan repair showcases
  const presetPhotos = [
    { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=60', label: 'Classic Sneaker Restoration' },
    { url: 'https://images.unsplash.com/photo-1614252329309-88019b78b87d?w=500&auto=format&fit=crop&q=60', label: 'Premium Suede Treatment' },
    { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60', label: 'Leather Heel Rebuild' },
    { url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop&q=60', label: 'Luxury Wingtip Polishing' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader 
        title="CW Chat" 
        subtitle="Artisan Studio Real-time Coordination Hub" 
      />

      <div className="bg-white border border-brand-bg/60 rounded-3xl shadow-xl overflow-hidden flex h-[calc(100vh-14rem)] min-h-[500px] md:h-[680px] relative">
        
        {/* SIDEBAR: Chats List */}
        <div className={clsx(
          "w-full md:w-[360px] lg:w-[400px] border-r border-brand-bg flex flex-col bg-white h-full transition-transform duration-300 md:translate-x-0",
          isMobileChatView ? "hidden md:flex" : "flex"
        )}>
          {/* User profile & search */}
          <div className="p-4 border-b border-brand-bg bg-[#FDFCFB] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-dark/10 border border-brand-dark/20 flex items-center justify-center text-brand-dark font-display font-bold uppercase relative">
                  {userProfile.photoURL ? (
                    <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{userProfile.displayName?.slice(0, 2) || 'A'}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide">{userProfile.displayName}</h4>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">{userProfile.role || 'Staff'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-brand-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600">Sync Active</span>
              </div>
            </div>

            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input 
                type="text" 
                placeholder="Search staff, groups, or updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-brand-bg/40 text-brand-dark text-xs font-medium placeholder-brand-muted border-none rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all"
              />
            </div>
          </div>

          {/* WhatsApp-like filter tabs */}
          <div className="px-4 py-3 flex gap-1.5 border-b border-brand-bg bg-white overflow-x-auto scrollbar-none">
            <button 
              onClick={() => setSelectedTab('all')}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                selectedTab === 'all' 
                  ? "bg-brand-dark text-white shadow-sm" 
                  : "bg-brand-bg/50 text-brand-muted hover:bg-brand-bg"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setSelectedTab('groups')}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                selectedTab === 'groups' 
                  ? "bg-brand-dark text-white shadow-sm" 
                  : "bg-brand-bg/50 text-brand-muted hover:bg-brand-bg"
              )}
            >
              Groups
            </button>
            <button 
              onClick={() => setSelectedTab('direct')}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                selectedTab === 'direct' 
                  ? "bg-brand-dark text-white shadow-sm" 
                  : "bg-brand-bg/50 text-brand-muted hover:bg-brand-bg"
              )}
            >
              Direct
            </button>
          </div>

          {/* Conversations list container */}
          <div className="flex-1 overflow-y-auto divide-y divide-brand-bg/40 bg-white">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-48">
                <HelpCircle className="w-8 h-8 text-brand-muted mb-2 opacity-60" />
                <p className="text-xs font-medium text-brand-muted">No chats found in this category.</p>
              </div>
            ) : (
              filteredConversations.map((chat) => {
                const isActive = activeChatId === chat.id;
                const lastMsg = getLastMessage(chat.id);
                const unreadCount = getUnreadCount(chat.id);

                return (
                  <button
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    className={clsx(
                      "w-full text-left px-4 py-3.5 flex items-start gap-3.5 transition-all focus:outline-none relative",
                      isActive ? "bg-brand-bg/50 border-l-4 border-brand-accent" : "hover:bg-brand-bg/20"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      {chat.isGroup ? (
                        <div className="w-11 h-11 rounded-2xl bg-brand-dark text-brand-accent/90 flex items-center justify-center text-sm font-bold shadow-md">
                          <Users className="w-5 h-5 text-brand-accent" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-brand-bg border border-brand-bg/80 text-brand-dark flex items-center justify-center text-xs font-black uppercase shadow-sm overflow-hidden">
                          {chat.photoUrl ? (
                            <img src={chat.photoUrl} alt={chat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span>{chat.name.slice(0, 2)}</span>
                          )}
                        </div>
                      )}
                      
                      {!chat.isGroup && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                      )}
                    </div>

                    {/* Chat description snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={clsx(
                          "text-xs font-bold uppercase tracking-wide truncate transition-colors",
                          isActive ? "text-brand-dark" : "text-brand-dark/95"
                        )}>
                          {chat.name}
                        </h4>
                        
                        {lastMsg && (
                          <span className="text-[9px] font-medium text-brand-muted">
                            {formatMessageTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-brand-muted truncate pr-2">
                        {lastMsg ? (
                          <>
                            <span className="font-bold text-brand-dark">{lastMsg.senderId === user.uid ? 'You: ' : `${lastMsg.senderName.split(' ')[0]}: `}</span>
                            {lastMsg.text || '📷 Photo attachment'}
                          </>
                        ) : (
                          chat.description
                        )}
                      </p>
                    </div>

                    {/* Right action counters */}
                    {unreadCount > 0 && (
                      <div className="absolute right-4 bottom-4 w-5 h-5 bg-brand-accent rounded-full flex items-center justify-center shadow-md animate-bounce">
                        <span className="text-[10px] font-black text-white">{unreadCount}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ACTIVE CHAT MAIN WINDOW */}
        <div className={clsx(
          "flex-1 flex flex-col bg-[#FAF9F5] h-full",
          !isMobileChatView ? "hidden md:flex" : "flex"
        )}>
          {activeChat ? (
            <>
              {/* Active Chat Header */}
              <div className="p-4 border-b border-brand-bg bg-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  {/* Back button for Mobile */}
                  <button 
                    onClick={() => setIsMobileChatView(false)}
                    className="md:hidden p-1 rounded-full text-brand-dark hover:bg-brand-bg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    {activeChat.isGroup ? (
                      <div className="w-10 h-10 rounded-2xl bg-brand-dark flex items-center justify-center text-brand-accent">
                        <Users className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-brand-bg flex items-center justify-center font-black text-xs text-brand-dark overflow-hidden">
                        {activeChat.photoUrl ? (
                          <img src={activeChat.photoUrl} alt={activeChat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{activeChat.name.slice(0, 2)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark leading-none mb-1">{activeChat.name}</h3>
                    <p className="text-[10px] text-brand-muted truncate max-w-xs md:max-w-md">
                      {activeChat.isGroup ? activeChat.description : 'Active staff coordination'}
                    </p>
                  </div>
                </div>

                {/* Header Call Mock Actions */}
                <div className="flex items-center gap-1">
                  <button className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-bg/50 transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-bg/50 transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-bg/50 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MESSAGES LOG CONTAINER */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F1EA] relative">
                {/* Visual noise overlay for paper background effect */}
                <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none mix-blend-overlay" />

                {activeChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
                    <MessageSquare className="w-12 h-12 text-brand-muted" />
                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide">No messages yet</h4>
                    <p className="text-[10px] text-brand-muted max-w-xs">Start the conversation! Use quick replies below to communicate with the team.</p>
                  </div>
                ) : (
                  activeChatMessages.map((msg, index) => {
                    const isSelf = msg.senderId === user.uid;
                    const isRead = msg.readBy && msg.readBy.length > 1;

                    return (
                      <div 
                        key={msg.id} 
                        className={clsx(
                          "flex flex-col w-full max-w-[85%] md:max-w-[70%]",
                          isSelf ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        {/* Sender's Display Name for Groups */}
                        {activeChat.isGroup && !isSelf && (
                          <span className="text-[9px] font-bold text-brand-accent uppercase tracking-wider mb-0.5 ml-2">
                            {msg.senderName}
                          </span>
                        )}

                        {/* Speech Bubble body */}
                        <div className={clsx(
                          "px-3.5 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed relative overflow-hidden",
                          isSelf 
                            ? "bg-[#D9EED1] text-brand-dark rounded-tr-none border border-[#C6E2BD]" 
                            : "bg-white text-brand-dark rounded-tl-none border border-brand-bg"
                        )}>
                          
                          {/* Image Attachment inside Bubble */}
                          {msg.imageUrl && (
                            <div className="mb-2 max-w-xs rounded-xl overflow-hidden shadow-sm">
                              <img src={msg.imageUrl} alt="Repair Attachment" className="w-full h-auto object-cover" />
                            </div>
                          )}

                          <p className="font-medium">{msg.text}</p>
                          
                          {/* Time & Read Status checkmarks */}
                          <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-60">
                            <span className="text-[8px] font-bold">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            
                            {isSelf && (
                              <span>
                                {isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-brand-muted" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies toolbar dock */}
              <div className="px-4 py-2 bg-white border-t border-brand-bg overflow-x-auto flex gap-2 items-center scrollbar-none z-10">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-muted whitespace-nowrap mr-1">Quick Replies:</span>
                {quickReplies.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => handleQuickReply(reply.text)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide border transition-all whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]",
                      reply.color
                    )}
                  >
                    <reply.icon className="w-3.5 h-3.5" />
                    <span>{reply.label}</span>
                  </button>
                ))}
              </div>

              {/* ATTACHMENT BOX DRAWER (Preset Photo selector) */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white border-t border-brand-bg p-4 z-10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-dark">Share Workpiece Photo</h4>
                      <button 
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-[9px] font-bold text-brand-muted hover:text-brand-dark uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {presetPhotos.map((photo) => {
                        const isChosen = selectedImage === photo.url;
                        return (
                          <button
                            key={photo.url}
                            onClick={() => {
                              setSelectedImage(isChosen ? null : photo.url);
                              setShowEmojiPicker(false);
                            }}
                            className={clsx(
                              "relative rounded-xl overflow-hidden aspect-video border-2 transition-all text-left group",
                              isChosen ? "border-brand-accent scale-[0.97]" : "border-transparent hover:border-brand-muted"
                            )}
                          >
                            <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                              <span className="text-[8px] font-bold text-white leading-tight truncate w-full">{photo.label}</span>
                            </div>
                            {isChosen && (
                              <div className="absolute top-2 right-2 bg-brand-accent text-white rounded-full p-0.5">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INPUT CONTAINER */}
              <div className="p-4 bg-white border-t border-brand-bg flex flex-col gap-2 shadow-md z-10">
                {/* Chosen Image preview */}
                {selectedImage && (
                  <div className="flex items-center justify-between bg-brand-bg/40 px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <img src={selectedImage} alt="Chosen asset" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <span className="text-[10px] font-bold text-brand-dark">Shared Artwork workpiece attached</span>
                        <p className="text-[8px] text-brand-muted">Will be sent as image card</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="p-1 rounded-full text-brand-muted hover:text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={clsx(
                      "p-2.5 rounded-2xl transition-colors hover:bg-brand-bg/50",
                      showEmojiPicker ? "text-brand-accent bg-brand-bg" : "text-brand-muted"
                    )}
                    title="Attach asset photo"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Type a coordinate message..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                      }}
                      className="w-full bg-brand-bg/40 text-brand-dark placeholder-brand-muted text-xs font-medium py-3 px-4 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </div>

                  <button 
                    onClick={handleSend}
                    disabled={!inputText.trim() && !selectedImage}
                    className="p-3 bg-brand-dark hover:bg-brand-accent text-white rounded-2xl transition-colors disabled:opacity-40 disabled:hover:bg-brand-dark shadow-sm flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full space-y-4">
              <div className="w-16 h-16 bg-brand-bg/50 rounded-full flex items-center justify-center text-brand-muted shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-dark uppercase tracking-wider">No Active Chat Selected</h4>
                <p className="text-xs text-brand-muted max-w-sm mt-1">Select an active store room, a direct employee line, or a channel from the left list to begin messaging.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
