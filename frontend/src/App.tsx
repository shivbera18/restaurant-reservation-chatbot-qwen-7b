import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { RestaurantExplorerModal } from './components/RestaurantExplorerModal';
import { ReservationsDrawer } from './components/ReservationsDrawer';
import { ModelPickerModal } from './components/ModelPickerModal';
import type { ChatMessage, Restaurant, Reservation, SystemConfig } from './types';
import {
  fetchConfig,
  sendChatMessage,
  fetchReservations,
  cancelReservation,
  resetConversation,
} from './api';

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);


  // Modals & Drawers
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isReservationsOpen, setIsReservationsOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Load initial configuration and active reservations
  const refreshAppData = async () => {
    try {
      const [cfg, resList] = await Promise.all([fetchConfig(), fetchReservations()]);
      setConfig(cfg);
      setActiveReservations(resList);
    } catch (err) {
      console.error('Failed to load initial app data:', err);
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
        created_reservation: res.active_reservations && res.active_reservations.length > 0
          ? res.active_reservations[res.active_reservations.length - 1]
          : undefined,
      };

      // Also check if any tool created a reservation
      if (!assistantMessage.created_reservation && res.tool_results) {
        const createTool = res.tool_results.find(
          (t) => t.tool_name === 'create_reservation' && t.success && t.data
        );
        if (createTool && createTool.data && typeof createTool.data === 'object') {
          const dataObj = createTool.data as Record<string, unknown>;
          assistantMessage.created_reservation = (dataObj.reservation || dataObj) as unknown as Reservation;
        }
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
      />

      <ModelPickerModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        config={config}
        onConfigUpdated={refreshAppData}
      />
    </div>
  );
}

export default App;
