const socket = io();

document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value;
    if (message.trim()) {
        addMessageToChatBox(`You: ${message}`);
        socket.emit('message', message);
        input.value = '';
    }
});

socket.on('message', function(message) {
    addMessageToChatBox(`Bot: ${message}`);
});

function addMessageToChatBox(message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
