"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { openai } from "@/lib/openai"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"

type Message = {
  content: string
  isUser: boolean
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const contentRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLInputElement>(null)


  async function onSubmit() {
    if (!contentRef.current || !promptRef.current) return

    const content = contentRef.current.value

    setMessages([
      ...messages,
      {
        content,
        isUser: true
      }
    ])

    const prompt = promptRef.current.value

    const previousMessages = messages

    setIsSubmitting(true)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      stream: false,
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `${prompt}
          \n-----------------\n

          PREVIOUS CONVERSATION:
          ${previousMessages.map((message) => {
            if (message.isUser) return `USER: ${message.content}\n`
            return `Assistant: ${message.content}\n`
          })}

          \n-----------------\n

          USER INPUT: ${content}
          `
        }
      ]
    })
    setIsSubmitting(false)

    setHasSubmitted(true)

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: response.choices[0].message.content ?? "",
        isUser: false,
      },
    ]);

    contentRef.current.value = ""
  }

  function exportChat() {
    const chat = messages.map((message) => {
      if (message.isUser) return `USER: ${message.content}\n`
      return `Assistant: ${message.content}\n`
    })

    const blob = new Blob(chat, { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.download = "chat.txt"
    link.href = url
    link.click()
  }

  function reset() {
    setMessages([])
    setHasSubmitted(false)
  }

  return (
    <main className="mx-auto container h-screen text-white">
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Promptin</CardTitle>
          <CardDescription>
            Enter in your initial prompt and see what results are better.
            <Input
              disabled={hasSubmitted}
              ref={promptRef} type="text" placeholder="Enter your prompt" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[75%]">
          <div className="flex flex-grow flex-col gap-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex flex-col", {
                "items-end": message.isUser,
                "items-start": !message.isUser
              })}>
                {message.content}
              </div>
            ))}
            {isSubmitting ? (
              <div className="flex flex-col items-start">
                <div className="animate-pulse w-1/2 h-4 bg-gray-300 rounded" />
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 w-full">
          <div className="flex flex-row w-full">
            <Input ref={contentRef} type="text" placeholder="Enter text" />
            <Button variant="default" onClick={onSubmit}>Send</Button>
          </div>
          <div className="flex flex-row justify-between w-full">
            <Button variant="default" onClick={reset}>Clear</Button>
            <Button variant="ghost" onClick={exportChat}>Export</Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
