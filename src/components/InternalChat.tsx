/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, ChevronDown, CheckCheck } from 'lucide-react';
import { subscribeToRecentMessages, saveDocument } from '../firebase';
import { ChatMessage } from '../types';

interface InternalChatProps {
  currentUser: string;
  otherActivePartners: { id: string; name: string }[];
}

const QUICK_PHRASES = [
  "👋 ¡Hola socios!",
  "⚠️ ¿Coordinamos?",
  "💰 Registré un cobro/pago",
  "📝 Presupuesto creado",
  "🛠️ Editando proyecto",
  "👍 ¡Listo, gracias!"
];

export default function InternalChat({ currentUser, otherActivePartners }: InternalChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInitError, setChatInitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef<number>(0);

  // Subscribe to real-time messages
  useEffect(() => {
    const unsub = subscribeToRecentMessages((items) => {
      // 1. Filter out null/undefined values or messages without actual text contents
      const validMessages = items.filter(m => m && typeof m.text === 'string' && m.text.trim() !== '');

      // 2. Sort messages ascending by timestamp safely, handling any invalid or missing dates
      const sorted = [...validMessages].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        const finalA = isNaN(timeA) ? 0 : timeA;
        const finalB = isNaN(timeB) ? 0 : timeB;
        return finalA - finalB;
      });
      
      // 3. Since subscribeToRecentMessages already limits to the 50 most recent on the cloud,
      // we can directly set the state and make loading extremely fast.
      setMessages(sorted);
      setChatInitError(null);
    }, (err) => {
      console.warn("Retrying/waiting for chat messages permissions:", err);
      setChatInitError(err.message || 'Error de permisos de Firestore');
    });

    return () => {
      unsub();
    };
  }, []);

  // Track unread messages when collapsed
  useEffect(() => {
    if (!isOpen) {
      if (messages.length > prevMessagesCountRef.current) {
        const added = messages.length - prevMessagesCountRef.current;
        // Verify the newly arrived messages are not sent by the current user
        const newExternalMessages = messages.slice(-added).filter(m => m.sender !== currentUser);
        if (newExternalMessages.length > 0) {
          setUnreadCount(prev => prev + newExternalMessages.length);
        }
      }
    } else {
      setUnreadCount(0);
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, isOpen, currentUser]);

  // Scroll to bottom when chat opens or new messages are received
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const newMessageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newMessage: ChatMessage = {
      id: newMessageId,
      sender: currentUser,
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    try {
      await saveDocument('messages', newMessageId, newMessage);
      setInputText('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const hasPartnersOnline = otherActivePartners.length > 0;

  return (
    <div id="internal-chat-widget" className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {!isOpen ? (
          // Collapsed Floating Button
          <motion.button
            key="chat-collapsed"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            onClick={() => setIsOpen(true)}
            className={`relative flex items-center gap-2 p-3.5 rounded-full shadow-lg border text-white transition-all duration-300 group ${
              hasPartnersOnline 
                ? 'bg-[#34877c] border-[#296a61] hover:bg-[#2c756b] shadow-emerald-500/10' 
                : 'bg-slate-700 border-slate-600 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-5 h-5 group-hover:scale-105 transition-transform" />
            
            {hasPartnersOnline && (
              <span className="text-xs font-semibold pr-1.5 hidden sm:inline">
                Chat Socios ({otherActivePartners.length})
              </span>
            )}

            {/* Pulsing indicator for active online partners */}
            {hasPartnersOnline && (
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-0.5 -mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white"></span>
              </span>
            )}

            {/* Unread message badge */}
            {unreadCount > 0 && !hasPartnersOnline && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
            
            {unreadCount > 0 && hasPartnersOnline && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </motion.button>
        ) : (
          // Expanded Chat Panel
          <motion.div
            key="chat-expanded"
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            className="w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 text-white flex items-center justify-between transition-colors duration-300 ${
              hasPartnersOnline ? 'bg-[#34877c]' : 'bg-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MessageSquare className="w-5 h-5" />
                  {hasPartnersOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white"></span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Chat de los Socios</h3>
                  <p className="text-[10px] opacity-90 font-medium">
                    {hasPartnersOnline 
                      ? `Coinciden: ${otherActivePartners.map(p => p.name).join(', ')}`
                      : 'Nadie más conectado ahora'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Active Partners Live Notification Banner inside the Chat */}
            {hasPartnersOnline ? (
              <div className="bg-amber-50 border-b border-amber-200/50 px-3 py-1.5 flex items-center gap-1.5 shrink-0">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                <span className="text-[10px] text-amber-800 font-semibold leading-none">
                  ¡Socio(s) en línea en paralelo! Coordiná cambios para evitar sobrescrituras.
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 border-b border-slate-100 px-3 py-1.5 flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-500 font-medium leading-none">
                  Podés dejar mensajes. El historial de las últimas 24hs queda guardado.
                </span>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {chatInitError ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-700">Iniciando chat de socios...</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs">
                    Estamos sincronizando el canal con Firestore. Si es la primera vez, el servidor puede tardar unos segundos en propagar los permisos.
                  </p>
                  <p className="text-[9px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    Sincronizando seguridad...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-700">Sin mensajes recientes</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs">
                    ¡Escribí el primer mensaje para empezar la conversación con los socios!
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender === currentUser;
                  // Look up if user has a custom theme color or just default
                  return (
                    <div 
                      key={msg.id || index} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Name of sender */}
                      {!isMe && (
                        <span className="text-[10px] font-bold text-slate-500 mb-0.5 ml-1.5">
                          {msg.sender}
                        </span>
                      )}
                      
                      {/* Message Bubble */}
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-xs break-words ${
                        isMe 
                          ? 'bg-[#34877c] text-white rounded-tr-xs' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        <div className={`text-[8px] mt-1 flex items-center justify-end gap-1 ${
                          isMe ? 'text-emerald-100/80' : 'text-slate-400'
                        }`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMe && <CheckCheck className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Phrases */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5 shrink-0">
              {QUICK_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(phrase)}
                  className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-medium transition-colors cursor-pointer shrink-0"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Footer Input Area */}
            <div className="p-3 bg-white border-t border-slate-150 flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                placeholder="Escribí un mensaje..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 border border-slate-200 focus:border-[#34877c] rounded-xl px-3 py-2 text-xs outline-none transition-colors"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim()}
                className={`p-2 rounded-xl text-white transition-all duration-200 ${
                  inputText.trim() 
                    ? 'bg-[#34877c] hover:bg-[#2c756b] shadow-xs cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
