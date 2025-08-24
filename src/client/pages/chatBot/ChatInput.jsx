import React, { useRef, useEffect } from 'react'; // <-- Import hooks
import "./chatBot.css";

const ChatInput = ({ input, setInput, onSend, onEnd, disabled }) => {
    // 1. Create a ref to get direct access to the div element
    const editableDivRef = useRef(null);

    // 2. This effect syncs the visual content of the div with the React state
    useEffect(() => {
        // When the `input` prop passed from the parent becomes an empty string...
        if (input === '') {
            // ... and the ref is attached to the div...
            if (editableDivRef.current) {
                // ...manually clear its visible text.
                editableDivRef.current.innerText = '';
            }
        }
    }, [input]); // This effect runs every time the `input` prop changes

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && input.trim() !== '') {
                onSend();
            }
        }
    };

    const handleInput = (e) => {
        setInput(e.currentTarget.innerText);
    };

    return (
        <div className="input-area">
            <div className="input-wrapper">
                <div
                    ref={editableDivRef}
                    className="chat-input-editable"
                    contentEditable={!disabled}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    data-placeholder="Ask for specs, product comparisons, or configurations..."
                ></div>
                
                <button 
                    className='send-button' 
                    onClick={onSend} 
                    disabled={disabled || input.trim() === ''}
                >
                    Send
                </button>
            </div>
            <button 
                className="exit-button" 
                onClick={onEnd} 
                disabled={disabled}
            >
                End Call & Generate Summary
            </button>
        </div>
    );
};

export default ChatInput;