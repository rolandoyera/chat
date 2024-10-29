"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import Image from "next/image";
import { ArrowUp } from "lucide-react"; // Import the X icon for stop
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

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/ex1",
    onError: (e) => console.error(e),
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

  // Handle form submission

  return (
    <div className="flex flex-col w-full h-full mx-auto stretch">
      <header className="p-4 w-full max-w-4xl mx-auto mt-5">
        <p>Meet</p>
        <h1 className={`${genesis.className} text-5xl font-bold`}>Genesis</h1>
      </header>

      <section className="container px-0 pb-10 flex flex-col flex-grow gap-4 mx-auto max-w-5xl">
        <ul
          ref={chatParent}
          className="h-1 p-4 flex-grow overflow-y-auto flex flex-col gap-4">
          {messages.map((m, index) => {
            return (
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
                        src="light-bulb.svg"
                        height={32}
                        width={32}
                        alt="Chat"
                      />

                      <div className="pl-12 py-4">
                        <Markdown
                          remarkPlugins={[remarkGfm]} // GitHub flavored Markdown support
                          components={{
                            p: ({ ...props }) => (
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
                            ul: ({ ...props }) => (
                              <ul
                                className="list-disc pl-5 mt-5 mb-5"
                                {...props}
                              />
                            ),
                            ol: ({ ...props }) => (
                              <ol className="list-decimal pl-5" {...props} />
                            ),
                            h1: ({ ...props }) => (
                              <h1 className="text-2xl font-bold" {...props} />
                            ),
                            h2: ({ ...props }) => (
                              <h2
                                className="text-xl font-semibold"
                                {...props}
                              />
                            ),
                            img: ({ ...props }) => (
                              <img
                                className="max-w-[500px] my-5 rounded-xl"
                                {...props}
                              />
                            ),
                            blockquote: ({ ...props }) => (
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
            );
          })}
        </ul>
      </section>

      <section className="p-4">
        {/* The form handles the submission, not the button directly */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-3xl mx-auto items-center mb-10">
          <Input
            placeholder="Message Genesis"
            type="text"
            value={input}
            onChange={handleInputChange}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  disabled={!input.trim()}
                  className="ml-2 rounded-full h-10 w-10"
                  type="submit"
                  size="icon">
                  <ArrowUp />
                </Button>
              </div>
            </TooltipTrigger>
            {!input.trim() && (
              <TooltipContent className="mb-2">
                <span>Message is empty</span>
              </TooltipContent>
            )}
          </Tooltip>
        </form>
      </section>
    </div>
  );
}
