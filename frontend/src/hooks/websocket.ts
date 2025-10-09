// import { useState } from "react";

// interface Message {
//     id: string;
//     type: "user" | "agent";
//     text: string;
//     timestamp: Date;
// }

// export const connectWebSocket = (setCurrentUserText: (text: string) => void, setMessages: (messages: Message[]) => void, wsRef: React.RefObject<WebSocket>) => {
//     const ws = new WebSocket('ws://localhost:8000/ws/audio');

//     ws.onopen = () => {
//         console.log('WebSocket connected');
//     };

//     ws.onmessage = (event) => {
//         const data = JSON.parse(event.data);
//         if (data.type === 'transcription') {
//             setCurrentUserText(data.text);

//             // If transcription is final, add to messages
//             if (data.is_final) {
//                 const userMessage: Message = {
//                     id: `user-${Date.now()}`,
//                     type: "user",
//                     text: data.text,
//                     timestamp: new Date(),
//                 };
//                 setMessages((prev) => [...prev, userMessage]);
//                 setCurrentUserText("");
//             }
//         }
//     };

//     ws.onclose = () => {
//         console.log('WebSocket disconnected');
//     };

//     ws.onerror = (error) => {
//         console.error('WebSocket error:', error);
//     };

//     wsRef.current = ws;
// };