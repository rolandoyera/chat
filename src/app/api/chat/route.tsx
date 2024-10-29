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
import {
  BASE_TEMPLATE,
  FINISHES_TEMPLATE,
  EMPLOYMENT_TEMPLATE,
  ADDRESS_TEMPLATE,
  RETURN_POLICY_TEMPLATE,
} from "../templates";

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

  // Dynamically inject parts based on the question
  if (userQuestion.includes("finishes")) {
    prompt += FINISHES_TEMPLATE;
  }

  if (userQuestion.includes("address") || userQuestion.includes("visit")) {
    prompt += ADDRESS_TEMPLATE;
  }

  if (userQuestion.includes("hiring") || userQuestion.includes("jobs")) {
    prompt += EMPLOYMENT_TEMPLATE;
  }

  if (userQuestion.includes("return") || userQuestion.includes("policy")) {
    // Instead of inserting the return policy word-for-word, ask the model to explain it
    prompt += RETURN_POLICY_TEMPLATE;
    prompt += `\nCan you explain the return policy in a more detailed and friendly way for the customer?`;
  }

  // Format documents as a string
  const formattedDocuments = formatDocumentsAsString(productData);
  const recentChatHistory = chatHistory.slice(-3).join("\n"); // Only last 3 messages

  prompt += `\n\nContext: ${formattedDocuments}`;
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
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      streaming: true,
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
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
