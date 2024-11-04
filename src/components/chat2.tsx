"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "ai/react";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUp, StopCircle } from "lucide-react"; // Import StopCircle icon
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Ephesis } from "next/font/google";

const genesis = Ephesis({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function Chat2() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, stop } = useChat({
    api: "/api/ex1",
    onError: (e) => console.error(e),
    onFinish: () => setIsGenerating(false),
  });

  const chatParent = useRef<HTMLUListElement>(null);

  // Scroll to the last message when a new message is added
  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      const lastMessage = domNode.lastElementChild;
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [messages]);

  // Handle stopping the response generation
  const handleStopGeneration = () => {
    stop();
    setIsGenerating(false);
  };

  // Custom handleSubmit that tracks generation state
  const handleSubmitWithState = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    await handleSubmit(e); // Calls handleSubmit with event, assuming this triggers chat API
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      <div className="p-4 max-w-[350px] w-full border-r-[1px]">
        <p>Chat 2</p>
      </div>
      <div className="px-0 pb-10 flex flex-col flex-grow gap-4 mx-auto mb-auto h-full max-w-5xl">
        <ul
          ref={chatParent}
          style={{ scrollbarWidth: "none" }}
          className="h-1 p-4 flex-grow overflow-y-auto flex flex-col gap-4">
          {messages.map((m, index) => (
            <div key={index}>
              {m.role === "user" ? (
                <li className="flex p-3 rounded-3xl ml-auto min-w-18 max-w-fit bg-input">
                  <p className="ml-auto mr-2 pl-4">{m.content}</p>
                </li>
              ) : (
                <li className="flex flex-row mt-4 mb-auto">
                  <div className="flex relative">
                    <Image
                      className="absolute bg-slate-700 p-1 rounded-full"
                      priority
                      src="/light-bulb.svg"
                      height={32}
                      width={32}
                      alt="Chat"
                    />
                    <div className="pl-12 py-4">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: (props) => (
                            <p className="leading-relaxed my-5" {...props} />
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline">
                              {children}
                            </a>
                          ),
                          ul: (props) => (
                            <ul
                              className="list-disc pl-5 mt-5 mb-5"
                              {...props}
                            />
                          ),
                          ol: (props) => (
                            <ol className="list-decimal pl-5" {...props} />
                          ),
                          h1: (props) => (
                            <h1 className="text-2xl font-bold" {...props} />
                          ),
                          h2: (props) => (
                            <h2 className="text-xl font-semibold" {...props} />
                          ),
                          img: (props) => (
                            <img
                              className="max-w-[500px] my-5 rounded-xl"
                              {...props}
                            />
                          ),
                          blockquote: (props) => (
                            <blockquote
                              className="border-l-4 border-gray-400 pl-4 italic text-gray-600"
                              {...props}
                            />
                          ),
                        }}>
                        {m.content}
                      </Markdown>
                    </div>
                  </div>
                </li>
              )}
            </div>
          ))}
        </ul>

        <div className="p-4">
          <form
            onSubmit={handleSubmitWithState}
            className="flex w-full max-w-3xl mx-auto items-center mb-10">
            <Input
              placeholder="Message Genesis"
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isGenerating} // Disable input while generating
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {isGenerating ? (
                    <Button
                      onClick={handleStopGeneration}
                      className="ml-2 rounded-full h-10 w-10 bg-red-500 hover:bg-red-600"
                      type="button"
                      size="icon">
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      disabled={!input.trim()}
                      className="ml-2 rounded-full h-10 w-10"
                      type="submit"
                      size="icon">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="mb-2">
                <span>
                  {isGenerating
                    ? "Stop generating"
                    : !input.trim()
                      ? "Message is empty"
                      : "Send message"}
                </span>
              </TooltipContent>
            </Tooltip>
          </form>
        </div>
      </div>
      <div className="p-4 max-w-[350px] w-full border-l-[1px] 2xl:flex flex-col items-center ">
        <div>
          <p className="-ml-6 -mb-2">Meet</p>
          <h1 className={`${genesis.className} text-5xl font-bold`}>Surety</h1>
        </div>
        <p className="mt-6 font-extralight">
          Surety knows details and some specifics of our General Insurance
          Policy. As time goes on she'll learn more and will provide information
          relating to our policy.
        </p>
      </div>
    </div>
  );
}
