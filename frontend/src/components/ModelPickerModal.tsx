import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Sparkles, ShieldAlert } from 'lucide-react';
import type { SystemConfig } from '../types';
import { switchProviderModel } from '../api';

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig | null;
  onConfigUpdated: () => void;
}

export const ModelPickerModal: React.FC<ModelPickerModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('groq');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');
  const [useMock, setUseMock] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setSelectedProvider(config.active_provider || 'groq');
      setSelectedModel(config.active_model || '');
      setUseMock(config.use_mock ?? false);
    }
  }, [config, isOpen]);

  if (!isOpen || !config) return null;

  const availableModelsForProvider = config.available_models[selectedProvider] || [];
  const defaultModelForProvider = config.default_models[selectedProvider] || '';

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    const def = config.default_models[newProvider] || '';
    setSelectedModel(def);
    setCustomModel('');
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const finalModel = selectedModel === 'custom' ? customModel : selectedModel || defaultModelForProvider;
      await switchProviderModel(selectedProvider, finalModel, useMock);
      onConfigUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch provider');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 shadow-neo-xl dark:shadow-neo-xl-dark rounded-neo-lg w-full max-w-xl my-auto overflow-hidden text-left">
        {/* Header */}
        <div className="bg-neo-purple border-b-3 border-black dark:border-gray-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center rounded-neo-sm font-bold text-base">
              🧠
            </div>
            <div>
              <h2 className="font-black text-lg uppercase tracking-tight text-black leading-none">
                AI Engine & Provider
              </h2>
              <p className="text-xs font-bold text-black mt-0.5">
                Pluggable LLM Backend Configuration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 bg-white hover:bg-neo-yellow border-2 border-black flex items-center justify-center rounded-neo-sm text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 bg-white dark:bg-neo-surface">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/40 border-2 border-red-500 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2 rounded-neo-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Offline Demo Mode Toggle */}
          <div className="bg-neo-yellow/20 dark:bg-neo-yellow/10 border-2 border-black dark:border-gray-600 p-3 rounded-neo-sm flex items-center justify-between">
            <div>
              <div className="font-black text-xs uppercase text-black dark:text-gray-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neo-orange" />
                <span>Offline Demo Mode</span>
              </div>
              <p className="text-[11px] text-black dark:text-gray-300 mt-0.5">
                Zero API keys needed; uses deterministic rule-based pattern matching.
              </p>
            </div>
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              className="w-5 h-5 border-2 border-black dark:border-gray-600 rounded-neo-sm text-black focus:ring-0 cursor-pointer"
            />
          </div>

          {!useMock && (
            <>
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-black dark:text-gray-300 mb-1.5">
                  Select Provider Backend:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {config.providers.map((p) => {
                    const label = config.provider_labels[p] || p;
                    const isSelected = selectedProvider === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleProviderChange(p)}
                        className={`p-2.5 border-2 border-black dark:border-gray-600 rounded-neo-sm text-left text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-neo-yellow text-black shadow-neo-sm translate-x-0.5 translate-y-0.5'
                            : 'bg-neo-canvas dark:bg-neo-surface-alt text-black dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <span className="block truncate font-bold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-black dark:text-gray-300 mb-1.5">
                  Select Model ID:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2.5 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 rounded-neo-sm text-xs font-mono font-bold text-black dark:text-gray-100 focus:outline-none"
                >
                  {availableModelsForProvider.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === defaultModelForProvider ? '(Default)' : ''}
                    </option>
                  ))}
                  <option value="custom">✏️ Custom Model ID...</option>
                </select>

                {selectedModel === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom model ID (e.g. openai/gpt-oss-120b)"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full mt-2 p-2.5 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 rounded-neo-sm text-xs font-mono font-bold text-black dark:text-gray-100 placeholder:text-gray-600 dark:placeholder:text-gray-400 dark:placeholder:text-black focus:outline-none"
                  />
                )}
              </div>
            </>
          )}

          {/* Context Note */}
          <div className="bg-neo-canvas dark:bg-neo-surface-alt border border-black dark:border-gray-600 p-2.5 rounded-neo-sm text-[11px] font-mono text-black dark:text-gray-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400 shrink-0 mt-0.5" />
            <span>
              <strong>Context Preserved:</strong> Switching models retains all existing conversation turns, selected venues, and active reservations.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neo-canvas dark:bg-neo-surface-alt border-t-2 border-black dark:border-gray-600 p-3 flex items-center justify-between text-xs font-mono">
          <button
            onClick={onClose}
            className="btn-neo bg-white dark:bg-neo-surface text-black dark:text-gray-200 px-4 py-1.5 uppercase font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-neo bg-neo-green text-black px-5 py-1.5 uppercase font-black shadow-neo-sm"
          >
            {saving ? 'Switching...' : 'Apply & Switch Engine'}
          </button>
        </div>
      </div>
    </div>
  );
};
