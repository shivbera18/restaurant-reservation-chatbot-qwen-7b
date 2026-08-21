import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RestaurantExplorerModal } from './components/RestaurantExplorerModal';
import { ReservationsDrawer } from './components/ReservationsDrawer';
import { ModelPickerModal } from './components/ModelPickerModal';
import { AuthModal } from './components/AuthModal';
import type { ChatMessage, Restaurant, Reservation, SystemConfig, User } from './types';
import {
  fetchConfig,
  sendChatMessage,
  sendChatMessageStream,
  fetchReservations,
  cancelReservation,
  resetConversation,
  fetchCurrentUser,
  logoutUser,
} from './api';

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  // Modals & Drawers
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isReservationsOpen, setIsReservationsOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshAppData = async () => {
    try {
      const [cfg, resList, currentUser] = await Promise.all([
        fetchConfig(),
        fetchReservations(),
        fetchCurrentUser(),
      ]);
      setConfig(cfg);
      setActiveReservations(resList);
      setUser(currentUser);
      setBackendOffline(false);
    } catch (err) {
      console.error('Failed to load initial app data:', err);
      setBackendOffline(true);
    }
  };

  useEffect(() => {
    refreshAppData();
  }, []);
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    const assistantMsgId = crypto.randomUUID();
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setLoading(true);

    try {
      let accumulatedTokens = '';
      await sendChatMessageStream(
        userText,
        {
          onToken: (token) => {
            accumulatedTokens += token;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: accumulatedTokens }
                  : msg
              )
            );
          },
          onFinal: (finalData) => {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== assistantMsgId) return msg;
                const updated: ChatMessage = {
                  ...msg,
                  tool_results: finalData.tool_results as ChatMessage['tool_results'],
                  selected_restaurant: finalData.selected_restaurant || undefined,
                };
                const createTool = finalData.tool_results?.find(
                  (tool) => tool.tool_name === 'create_reservation' && tool.success && tool.data
                );
                if (createTool && typeof createTool.data === 'object') {
                  const data = createTool.data as Record<string, unknown>;
                  updated.created_reservation = (data.reservation || data) as Reservation;
                }
                return updated;
              })
            );

            if (finalData.selected_restaurant) {
              setSelectedRestaurant(finalData.selected_restaurant);
            }

            if (finalData.active_reservations) {
              setActiveReservations(finalData.active_reservations);
            } else {
              refreshAppData();
            }
          },
        }
      );
    } catch (err) {
      console.warn('Stream failed or fell back, attempting standard chat...', err);
      try {
        const fallbackRes = await sendChatMessage(userText);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: fallbackRes.response,
                  tool_results: fallbackRes.tool_results,
                  selected_restaurant: fallbackRes.selected_restaurant || undefined,
                }
              : msg
          )
        );
        if (fallbackRes.selected_restaurant) setSelectedRestaurant(fallbackRes.selected_restaurant);
        if (fallbackRes.active_reservations) setActiveReservations(fallbackRes.active_reservations);
      } catch (fallbackErr) {
        console.error('Chat error:', fallbackErr);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ **Error processing request:** ${
                    fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error occurred.'
                  }\n\nPlease check your API key / model configuration in the AI Engine menu above.`,
                }
              : msg
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState<{ text: string; kind: 'error' | 'success' } | null>(null);

  const handleCancelBooking = async (code: string) => {
    if (!user) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await cancelReservation(code);
      await refreshAppData();
      const cancelConfirmMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `✅ Reservation with confirmation code **${code}** has been successfully cancelled.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cancelConfirmMsg]);
      setToast({ text: `Reservation ${code} cancelled.`, kind: 'success' });
    } catch (err) {
      setToast({
        text: `Failed to cancel ${code}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        kind: 'error',
      });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleResetChat = async () => {
    setIsResetting(true);
    try {
      await resetConversation();
      setMessages([]);
      setSelectedRestaurant(null);
      await refreshAppData();
    } catch (err) {
      console.error('Failed to reset conversation:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectRestaurantFromExplorer = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsExplorerOpen(false);
    handleSendMessage(`I'd like to check table availability for ${restaurant.name} in ${restaurant.neighborhood || 'Downtown'}.`);
  };

  return (
    <div className="min-h-screen neo-grid-bg text-black relative overflow-x-hidden">
      {/* Floating Hovering Sidebar Navigation */}
      <Sidebar
        config={config}
        activeReservationsCount={activeReservations.length}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenExplorer={() => setIsExplorerOpen(true)}
        onOpenReservations={() => setIsReservationsOpen(true)}
        onResetChat={handleResetChat}
        isResetting={isResetting}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        user={user}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onLogout={async () => {
          await logoutUser();
          setUser(null);
          setActiveReservations([]);
          refreshAppData();
        }}
      />

      {/* Main Chat Canvas with Adaptive Floating Sidebar Padding */}
      <main
        className={`flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:pl-28' : 'md:pl-80 lg:pl-88'
        }`}
      >
        <ChatArea
          messages={messages}
          loading={loading}
          onSendMessage={handleSendMessage}
          onCancelReservation={handleCancelBooking}
          onSelectRestaurant={(r) => {
            setSelectedRestaurant(r);
            handleSendMessage(`I'd like to check table availability for ${r.name}`);
          }}
          selectedRestaurant={selectedRestaurant}
          restaurantCount={config?.stats?.restaurants_count}
          user={user}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
          onLogout={async () => {
            await logoutUser();
            setUser(null);
            setActiveReservations([]);
            refreshAppData();
          }}
          onOpenExplorer={() => setIsExplorerOpen(true)}
          onOpenReservations={() => setIsReservationsOpen(true)}
          activeReservationsCount={activeReservations.length}
          backendOffline={backendOffline}
          onRetryConnection={refreshAppData}
        />
      </main>

      {/* Modals & Drawers */}
      <RestaurantExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        onSelectRestaurant={handleSelectRestaurantFromExplorer}
      />

      <ReservationsDrawer
        isOpen={isReservationsOpen}
        onClose={() => setIsReservationsOpen(false)}
        onReservationUpdated={refreshAppData}
        initialReservations={activeReservations}
        user={user}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      <ModelPickerModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        config={config}
        onConfigUpdated={refreshAppData}
      />

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          refreshAppData();
        }}
        initialMode={authModalMode}
      />

      {/* Toast Notifications */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[100] border-3 border-black rounded-neo shadow-neo-lg px-4 py-3 font-black text-sm max-w-xs ${
            toast.kind === 'error' ? 'bg-red-300 text-black' : 'bg-neo-green text-black'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default App;
