import {
  Message as VercelChatMessage,
  StreamingTextResponse,
  createStreamDataTransformer,
} from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { Document } from "langchain/document";
import { BASE_TEMPLATE, GENERAL_LIABILITY_TEMPLATE } from "../templates";

const loader = new JSONLoader("src/data/products.json");

export const dynamic = "force-dynamic";

/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

/**
 * Function to dynamically build the prompt based on the user's question
 */
const formatConversation = (
  userQuestion: string,
  chatHistory: string[],
  productData: Document<Record<string, any>>[]
) => {
  let prompt = BASE_TEMPLATE;

  if (
    userQuestion.toLowerCase().includes("insurance") ||
    userQuestion.toLowerCase().includes("liability") ||
    userQuestion.toLowerCase().includes("general liability insurance") ||
    userQuestion.toLowerCase().includes("policy details") ||
    userQuestion.toLowerCase().includes("policy number") ||
    userQuestion.toLowerCase().includes("policy limits") ||
    userQuestion.toLowerCase().includes("coverage") ||
    userQuestion.toLowerCase().includes("insurance info")
  ) {
    prompt += GENERAL_LIABILITY_TEMPLATE;
  }

  // Format documents as a string
  const formattedDocuments = formatDocumentsAsString(productData);
  const recentChatHistory = chatHistory.slice(-3).join("\n"); // Only last 3 messages

  prompt += `\nContext: ${formattedDocuments}`;
  prompt += `\nCurrent conversation:\n${recentChatHistory}`;
  prompt += `\nuser: ${userQuestion}\nassistant:`;

  return prompt;
};

export async function POST(req: Request) {
  try {
    // Extract the `messages` from the body of the request
    const { messages } = await req.json();

    // Format the previous messages (excluding the latest one)
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);

    // Get the current message (user's latest input)
    const currentMessageContent = messages[messages.length - 1].content;

    // Load the product data from JSON
    const docs = (await loader.load()) as Document<Record<string, any>>[]; // Ensure this is typed correctly

    // Dynamically construct the prompt based on user input
    const constructedPrompt = formatConversation(
      currentMessageContent,
      formattedPreviousMessages,
      docs
    );

    // Instantiate the PromptTemplate (this is the key fix)
    const promptTemplate = new PromptTemplate({
      template: constructedPrompt,
      inputVariables: ["chat_history", "question"],
    });

    const model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4o-mini",
      temperature: 0.8,
      streaming: true,
      verbose: false, // Turn off verbose logging
    });

    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and encoding.
     */
    const parser = new HttpResponseOutputParser();

    // Now using `promptTemplate` and passing the model and parser as Runnables
    const chain = RunnableSequence.from([
      promptTemplate, // Generates the prompt
      model, // Runs the model
      parser, // Parses the model's response
    ]);

    // Convert the response into a friendly text-stream
    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      question: currentMessageContent,
    });

    // Respond with the stream
    return new StreamingTextResponse(
      stream.pipeThrough(createStreamDataTransformer())
    );
  } catch (e: any) {
    console.error("Error:", e); // Log the error for debugging
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
