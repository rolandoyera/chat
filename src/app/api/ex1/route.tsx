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
  ADDRESS_TEMPLATE_HOURS,
  HISTORY_TEMPLATE,
  RETURN_POLICY_TEMPLATE,
  SHOWROOM_VISIT_TEMPLATE,
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

// Function to get the product based on user input
const getProductFromQuery = (
  query: string,
  productData: Document<Record<string, any>>[]
) => {
  for (const doc of productData) {
    // Log the pageContent for debugging purposes
    console.log("pageContent:", doc.pageContent);

    // Check if pageContent is already an object, and only parse if it's a string
    let collection;
    try {
      collection =
        typeof doc.pageContent === "string"
          ? JSON.parse(doc.pageContent)
          : doc.pageContent;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      continue; // Skip to the next document if JSON parsing fails
    }

    // If collection has products, loop through to find matching product
    if (collection.products) {
      for (const product of collection.products) {
        if (
          query.toLowerCase().includes(product.item.toLowerCase()) ||
          query.includes(product["item#"])
        ) {
          return product;
        }
      }
    }
  }
  return null;
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

  const keywordsAddress = [
    "address",
    "visit",
    "hours",
    "time",
    "close",
    "open",
  ];

  if (
    keywordsAddress.some((keywordsAddress) =>
      userQuestion.toLowerCase().includes(keywordsAddress)
    )
  ) {
    prompt += ADDRESS_TEMPLATE_HOURS;
  }
  if (userQuestion.includes("hiring") || userQuestion.includes("jobs")) {
    prompt += EMPLOYMENT_TEMPLATE;
  }

  if (userQuestion.includes("history")) {
    prompt += HISTORY_TEMPLATE;
    prompt += `\nCan you explain more about the company's history in a detailed and customer-friendly way?`;
  }
  if (userQuestion.includes("return") || userQuestion.includes("policy")) {
    prompt += RETURN_POLICY_TEMPLATE;
    prompt += `\n\nCan you provide a more detailed and customer-friendly explanation of this product's description and specifications?`;
  }
  const showroomKeywords = ["showroom", "visit", "appointment"];
  if (
    showroomKeywords.some((word) => userQuestion.toLowerCase().includes(word))
  ) {
    prompt += SHOWROOM_VISIT_TEMPLATE;
    prompt += `\n\nCan you explain how to make an appointment to visit the showroom in a detailed and customer-friendly way?`;
  }

  // Check for product-specific queries
  const product = getProductFromQuery(userQuestion, productData);
  if (product) {
    prompt += `\nIt looks like you're asking about the "${product.item}". Below are the detailed specifications:\n`;
    prompt += `- **Weight**: ${product.weight}\n`;
    prompt += `- **Dimensions**: ${product.dimensions}\n`;
    prompt += `- **Height (Min/Max)**: ${product.min_max_height}\n`;
    prompt += `- **Bulb Type**: ${product.bulb_type}\n`;
    prompt += `- **Bulb Quantity**: ${product.bulb_qty}\n`;
    prompt += `- **Canopy Dimensions**: ${product.canopy_dimensions}\n`;
    prompt += `- **Location Rating**: ${product.location_rating}\n`;
    // Wrap the URL in an anchor tag to make it clickable
    prompt += `\nFor more details, you can visit the product page: <a href="${product.item_url}" target="_blank">${product.item_url}</a>.`;
    prompt += `\n\nCan you provide a more detailed and customer-friendly explanation of this product's description and specifications?`;
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
      apiKey: process.env.OPENAI_API_KEY4!,
      model: "gpt-4o-mini",
      temperature: 0.8,
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
    console.error("Error:", e); // Log the error for debugging
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
