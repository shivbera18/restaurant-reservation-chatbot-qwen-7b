import { useState, useEffect } from 'react';
import { Header } from './components/Header';
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
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    refreshAppData();
  }, []);

  const handleSendMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userText);

      // Check if this turn created or modified a reservation
      let createdRes: Reservation | null = null;
      if (response.tool_results) {
        const createTool = response.tool_results.find(
          (t) => (t.tool_name === 'create_reservation' || t.tool_name === 'modify_reservation') && t.success
        );
        if (createTool && createTool.data && typeof createTool.data === 'object') {
          const dataObj = createTool.data as Record<string, unknown>;
          createdRes = (dataObj.reservation || dataObj) as unknown as Reservation;
        }
      }

      if (response.selected_restaurant) {
        setSelectedRestaurant(response.selected_restaurant);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        tool_results: response.tool_results,
        selected_restaurant: response.selected_restaurant,
        created_reservation: createdRes,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh active bookings list
      if (response.active_reservations && response.active_reservations.length > 0) {
        setActiveReservations(response.active_reservations);
      } else {
        const freshBookings = await fetchReservations();
        setActiveReservations(freshBookings);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error processing request**: ${
          err instanceof Error ? err.message : 'Unknown error occurred'
        }\n\nPlease check your API key / model configuration in the AI Engine menu above.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (code: string) => {
    try {
      await cancelReservation(code);
      await refreshAppData();
      // Add system confirmation message in chat
      const sysMsg: ChatMessage = {
        id: `cancel-${Date.now()}`,
        role: 'assistant',
        content: `✅ Reservation **${code}** has been cancelled successfully.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    } catch (err) {
      alert(`Could not cancel booking: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  const handleResetChat = async () => {
    setIsResetting(true);
    try {
      await resetConversation();
      setMessages([]);
      setSelectedRestaurant(null);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectRestaurantFromExplorer = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    const prompt = `Can you check table availability and tell me about ${restaurant.name} in ${restaurant.neighborhood}?`;
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col neo-grid-bg text-[#121212]">
      {/* Header */}
      <Header
        config={config}
        activeReservationsCount={activeReservations.length}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenExplorer={() => setIsExplorerOpen(true)}
        onOpenReservations={() => setIsReservationsOpen(true)}
        onResetChat={handleResetChat}
        isResetting={isResetting}
      />

      {/* Main Chat Canvas */}
      <main className="flex-1 flex flex-col overflow-hidden">
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
