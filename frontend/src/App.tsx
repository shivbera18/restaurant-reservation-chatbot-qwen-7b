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
      id: String(Date.now()),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await sendChatMessage(userText);

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.response,
        timestamp: new Date(),
        tool_results: res.tool_results,
        selected_restaurant: res.selected_restaurant || undefined,
      };

      const createTool = res.tool_results?.find(
        (tool) => tool.tool_name === 'create_reservation' && tool.success && tool.data,
      );
      if (createTool && typeof createTool.data === 'object') {
        const data = createTool.data as Record<string, unknown>;
        assistantMessage.created_reservation = (data.reservation || data) as Reservation;
      }

      setMessages((prev) => [...prev, assistantMessage]);

      if (res.selected_restaurant) {
        setSelectedRestaurant(res.selected_restaurant);
      }

      if (res.active_reservations) {
        setActiveReservations(res.active_reservations);
      } else {
        refreshAppData();
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `⚠️ **Error processing request:** ${
          err instanceof Error ? err.message : 'Unknown error occurred.'
        }\n\nPlease check your API key / model configuration in the AI Engine menu above.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

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
        id: String(Date.now()),
        role: 'assistant',
        content: `✅ Reservation with confirmation code **${code}** has been successfully cancelled.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cancelConfirmMsg]);
    } catch (err) {
      alert(`Failed to cancel: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

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
    </div>
  );
}

export default App;
