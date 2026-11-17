
import { useState, useRef, useEffect } from 'react';
import {
  User,
  Bot,
  AlertCircle,
  Send,
  GraduationCap
} from 'lucide-react';

export default function CampusChatbot() {
  const [instruction, setInstruction] = useState('system');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: 'Hello! I am CampusGuide AI. Ask me a question about the reference PDF.'
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, isLoading]);

  const handleSend = async (customText) => {
    const textToSend = (
      typeof customText === 'string' ? customText : input
    ).trim();

    if (!textToSend || isLoading) return;

    setError(null);

    const history = messages.slice(1);

    setMessages((previous) => [
      ...previous,
      { role: 'user', text: textToSend }
    ]);

    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history,
          instruction
        })
      });

      const responseText = await response.text();

      let data;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(
          `Invalid server response. HTTP ${response.status}. Check the backend.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
          `Server error: HTTP ${response.status}`
        );
      }

      if (
        typeof data?.reply !== 'string' ||
        !data.reply.trim()
      ) {
        throw new Error(
          'Gemini returned an empty response. Please try again.'
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'model',
          text: data.reply.trim()
        }
      ]);

    } catch (err) {
      console.error('CampusGuide chat error:', err);

      if (err instanceof TypeError) {
        setError(
          'Cannot connect to the backend. Make sure both the frontend and backend servers are running.'
        );
      } else {
        setError(err.message || 'Something went wrong.');
      }

    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInstructionChange = (event) => {
    const selectedInstruction = event.target.value;

    setInstruction(selectedInstruction);

    setMessages([
      {
        role: 'model',
        text: 'Hello! I am CampusGuide AI. Ask me a question using the selected instructions.'
      }
    ]);

    setError(null);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">

        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-indigo-600" />

          <h1 className="text-base font-semibold text-slate-800">
            CampusGuide AI
          </h1>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">

          <span>Instructions</span>

          <select
            value={instruction}
            onChange={handleInstructionChange}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
            disabled={isLoading}
          >
            <option value="system">
              Built-in system prompt
            </option>

            <option value="knowledge-base">
              knowledge-base.txt
            </option>
          </select>

        </label>
      </header>

      {/* Main Chat Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">

        <div className="mx-auto max-w-3xl space-y-5">

          <div className="space-y-4 pt-2">

            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >

                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'rounded-tr-none bg-indigo-600 text-white'
                        : 'rounded-tl-none border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>

                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>

                <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-xs">

                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500"></span>

                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:0.2s]"></span>

                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:0.4s]"></span>

                  <span className="ml-2 text-xs font-medium text-slate-400">
                    Checking the reference PDF...
                  </span>

                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-slate-200 bg-white p-4">

        <div className="mx-auto flex max-w-3xl items-center gap-2">

          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type your question here..."
            autoComplete="off"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />

          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>

        </div>

        <p className="mt-2 text-center text-[11px] text-slate-400">
          CampusGuide AI answers based on the configured reference PDF.
        </p>

      </footer>
    </div>
  );
}
