import { Request, Response } from 'express'
import OpenAI from 'openai'
import { GroceryChat } from './booking.model'
import { JwtPayload } from 'jsonwebtoken'
import catchAsync from '../../../shared/catchAsync'
import { itemExtractionSchema } from './booking.constants'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import config from '../../../config'

const client = new OpenAI({ apiKey: config.openAi_api_key })

// =====================
// Grocery Bot Messaging
// =====================
export const sendMessageToGroceryBot = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId, message } = req.body
    const user = req.user as JwtPayload & { authId: string }

    let session = await GroceryChat.findById(sessionId)
    if (!session) {
      session = await GroceryChat.create({
        user: user.authId,
        items: [],
        status: 'draft',
      })
    }

    // -----------------------
    // AI: Extract Grocery Item
    // -----------------------
    const aiExtract = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a grocery assistant. Extract items strictly using function calls.',
        },
        { role: 'user', content: message },
      ],
      tools: [{ type: 'function', function: itemExtractionSchema }],
      tool_choice: 'auto',
    })

    const choice = aiExtract.choices[0]
    const toolCalls = choice.message.tool_calls

    // If item extraction happened
    if (choice.finish_reason === 'tool_calls' && toolCalls?.length) {
      const firstToolCall = toolCalls[0] as any
      const extracted = JSON.parse(firstToolCall.function.arguments)

      // Save extracted data
      session.items.push({
        name: extracted.name,
        quantity: extracted.quantity,
      })
      await session.save()

      // AI Suggestion
      const suggestionAI = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Give a short recommendation about the grocery item. Keep it concise.',
          },
          {
            role: 'user',
            content: `Item: ${extracted.name}, Quantity: ${extracted.quantity}`,
          },
        ],
      })

      const suggestion =
        suggestionAI.choices[0].message.content ??
        'Suggestion unavailable at the moment.'

      return sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Item added successfully.`,
        data: {
          sessionId: session._id,
          item: extracted,
          suggestion,
          items: session.items,
        },
      })
    }

    // Fallback if AI gives normal text response
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: choice.message.content || 'Noted.',
      data: {
        sessionId: session._id,
        items: session.items,
      },
    })
  },
)

// ==========================
// Confirm Grocery Order
// ==========================
export const confirmGroceryOrder = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.body

    const session = await GroceryChat.findById(sessionId)
    if (!session) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: 'Session not found',
        data: null,
      })
    }

    session.status = 'confirmed'
    await session.save()

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Order confirmed. Please provide delivery address & time.',
      data: {
        sessionId: session._id,
        items: session.items,
      },
    })
  },
)
