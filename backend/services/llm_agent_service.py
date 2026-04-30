"""
LLM-Powered Agent Service using Groq API
Intelligent intent detection with function calling (like Aether)
"""
import os
import json
from typing import Dict, List, Optional
from groq import Groq
from services import todo_service, memory_service


class LLMAgentService:
    """
    Intelligent agent powered by Groq's Llama-3 with function calling.
    Automatically detects user intent and executes appropriate tools.
    """
    
    def __init__(self):
        """Initialize Groq client and tool definitions."""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"  # Fast and intelligent
        self.conversation_history: Dict[str, List[Dict]] = {}
        self.tools = self._build_tools()
        self.system_prompt = self._get_system_prompt()
    
    def _get_system_prompt(self) -> str:
        """Define agent personality and capabilities."""
        return """You are Doraemon, a friendly and helpful AI voice assistant.

Your capabilities:
- Manage to-do tasks (create, list, update, delete)
- Store and recall important user information (memories)
- Have natural conversations

Personality:
- Friendly and conversational
- Concise but helpful
- Proactive in using tools when appropriate

When the user mentions tasks or things to remember, automatically use the appropriate tools.
Always confirm actions clearly (e.g., "I've added 'buy milk' to your tasks").
"""
    
    def _build_tools(self) -> List[Dict]:
        """Build function calling tool definitions for Groq."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "create_todo",
                    "description": "Creates a new to-do task. Use when user wants to add, create, or remember a task.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task": {
                                "type": "string",
                                "description": "The task description"
                            }
                        },
                        "required": ["task"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_todos",
                    "description": "Lists all to-do tasks. Use when user asks to see, show, or list their tasks.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_todo",
                    "description": "Deletes a task by matching its description. Use when user wants to remove, delete, or complete a task.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_description": {
                                "type": "string",
                                "description": "The task description to match and delete"
                            }
                        },
                        "required": ["task_description"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "store_memory",
                    "description": "Stores important information about the user. Use when user shares personal info, preferences, or asks you to remember something.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "content": {
                                "type": "string",
                                "description": "The information to remember"
                            }
                        },
                        "required": ["content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "recall_memories",
                    "description": "Retrieves stored memories. Use when user asks what you remember or recall about them.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            }
        ]
    
    def process_message(self, message: str, session_id: str = "default") -> dict:
        """
        Process user message with LLM and function calling.
        
        Args:
            message: User's input text
            session_id: Session identifier for conversation context
            
        Returns:
            dict: {type, response, data}
        """
        try:
            # Initialize session if needed
            if session_id not in self.conversation_history:
                self.conversation_history[session_id] = []
            
            # Build messages with context
            messages = self._build_messages(message, session_id)
            
            # Call Groq LLM with function calling
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=self.tools,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=1024
            )
            
            assistant_message = response.choices[0].message
            
            # Check if tools were called
            if assistant_message.tool_calls:
                return self._handle_tool_calls(assistant_message, messages, session_id)
            else:
                # No tool calls - just conversation
                response_text = assistant_message.content or "I'm here to help!"
                self._update_history(session_id, message, response_text)
                return {
                    "type": "chat",
                    "response": response_text,
                    "data": None
                }
        
        except Exception as e:
            print(f"[LLM Agent Error] {e}")
            return {
                "type": "chat",
                "response": f"I encountered an error: {str(e)}. Please try again.",
                "data": None
            }
    
    def _build_messages(self, user_message: str, session_id: str) -> List[Dict]:
        """Build message list for LLM API call."""
        messages = [{"role": "system", "content": self.system_prompt}]
        
        # Add current task context
        try:
            tasks = todo_service.list_todos()
            if tasks:
                task_context = "Current tasks:\n"
                for task in tasks:
                    task_context += f"- {task['text']} (ID: {task['id']})\n"
                messages.append({"role": "system", "content": task_context})
        except:
            pass
        
        # Add conversation history
        history = self.conversation_history.get(session_id, [])
        messages.extend(history[-10:])  # Last 10 messages for context
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    def _handle_tool_calls(self, assistant_message, messages: List[Dict], session_id: str) -> dict:
        """Execute tool calls and generate final response."""
        tool_results = []
        
        # Execute each tool call
        for tool_call in assistant_message.tool_calls:
            tool_name = tool_call.function.name
            try:
                params = json.loads(tool_call.function.arguments)
            except:
                params = {}
            
            print(f"[Tool Call] {tool_name} with params: {params}")
            
            # Execute the tool
            result = self._execute_tool(tool_name, params)
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": tool_name,
                "content": json.dumps(result)
            })
        
        # Get final response from LLM with tool results
        messages.append(assistant_message)
        messages.extend(tool_results)
        
        try:
            final_response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=512
            )
            response_text = final_response.choices[0].message.content or "Done!"
        except:
            # Fallback if second call fails
            response_text = self._format_tool_results_fallback(tool_results)
        
        # Update history
        user_message = messages[-len(tool_results)-2]["content"]
        self._update_history(session_id, user_message, response_text)
        
        return {
            "type": "todo" if "todo" in tool_results[0]["name"] else "memory",
            "response": response_text,
            "data": {"tool_results": tool_results}
        }
    
    def _execute_tool(self, tool_name: str, params: Dict) -> Dict:
        """Execute a tool and return result."""
        try:
            if tool_name == "create_todo":
                task = todo_service.add_todo(params["task"])
                return {"success": True, "task": task}
            
            elif tool_name == "list_todos":
                tasks = todo_service.list_todos()
                return {"success": True, "tasks": tasks, "count": len(tasks)}
            
            elif tool_name == "delete_todo":
                # Find task by description match
                tasks = todo_service.list_todos()
                task_desc = params["task_description"].lower()
                deleted = None
                
                for task in tasks:
                    if task_desc in task["text"].lower() or task["text"].lower() in task_desc:
                        todo_service.delete_todo(task["id"])
                        deleted = task
                        break
                
                if deleted:
                    return {"success": True, "deleted": deleted}
                else:
                    return {"success": False, "error": "Task not found"}
            
            elif tool_name == "store_memory":
                memory = memory_service.save_memory(params["content"])
                return {"success": True, "memory": memory}
            
            elif tool_name == "recall_memories":
                memories = memory_service.list_memories()
                return {"success": True, "memories": memories, "count": len(memories)}
            
            else:
                return {"success": False, "error": f"Unknown tool: {tool_name}"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _format_tool_results_fallback(self, tool_results: List[Dict]) -> str:
        """Fallback response formatting if LLM call fails."""
        responses = []
        for result in tool_results:
            data = json.loads(result["content"])
            if data.get("success"):
                if "task" in data:
                    responses.append(f"Added task: {data['task']['text']}")
                elif "tasks" in data:
                    if data["tasks"]:
                        task_list = ", ".join([t["text"] for t in data["tasks"]])
                        responses.append(f"Your tasks: {task_list}")
                    else:
                        responses.append("You have no tasks.")
                elif "deleted" in data:
                    responses.append(f"Deleted task: {data['deleted']['text']}")
                elif "memory" in data:
                    responses.append("I've saved that to memory.")
                elif "memories" in data:
                    if data["memories"]:
                        mem_list = ", ".join([m["content"] for m in data["memories"]])
                        responses.append(f"I remember: {mem_list}")
                    else:
                        responses.append("I don't have any memories yet.")
        return " ".join(responses) if responses else "Done!"
    
    def _update_history(self, session_id: str, user_msg: str, assistant_msg: str):
        """Update conversation history."""
        self.conversation_history[session_id].append({"role": "user", "content": user_msg})
        self.conversation_history[session_id].append({"role": "assistant", "content": assistant_msg})
        
        # Keep only last 20 messages
        if len(self.conversation_history[session_id]) > 20:
            self.conversation_history[session_id] = self.conversation_history[session_id][-20:]


# Singleton instance
_llm_agent = None

def get_llm_agent() -> LLMAgentService:
    """Get or create LLM agent instance."""
    global _llm_agent
    if _llm_agent is None:
        _llm_agent = LLMAgentService()
    return _llm_agent
