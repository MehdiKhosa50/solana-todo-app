import { useState } from 'react'
import styles from '../../styles/Todo.module.css'

const TodoSection = ({ 
    title, 
    todos, 
    markAction,    // For marking todos as complete
    removeAction,  // For removing todos
    processingTodos = new Set(), // Set of todo indices being processed
    disabled = false,
    emptyMessage = "No todos",
    emptySubtext = "Create your first todo!"
}) => {
    const [processingId, setProcessingId] = useState(null)

    const handleMarkComplete = async (todoIdx, todoId) => {
        if (!markAction || processingTodos.has(todoIdx)) return
        
        setProcessingId(todoId)
        try {
            await markAction(todoIdx)
        } finally {
            setProcessingId(null)
        }
    }

    const handleRemove = async (todoIdx, todoId) => {
        if (!removeAction || processingTodos.has(todoIdx)) return
        
        setProcessingId(todoId)
        try {
            await removeAction(todoIdx)
        } finally {
            setProcessingId(null)
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now'
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now'
        const now = Date.now()
        const diff = now - (timestamp * 1000)
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        return 'Just now'
    }

    return (
        <div className={styles.todoSection}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>
                        {title.includes('Active') ? '📋' : '✅'}
                    </span>
                    {title}
                </h2>
                <span className={styles.sectionCounter}>
                    {todos.length}
                </span>
            </div>

            {todos.length === 0 ? (
                <div className={styles.emptySection}>
                    <div className={styles.emptyIcon}>
                        {title.includes('Active') ? '📝' : '🎉'}
                    </div>
                    <div className={styles.emptyText}>{emptyMessage}</div>
                    <div className={styles.emptySubtext}>{emptySubtext}</div>
                </div>
            ) : (
                <div className={styles.todoList}>
                    {todos.map((todo, index) => {
                        const isCompleted = todo.account.marked
                        const isProcessing = processingId === todo.publicKey.toString() || processingTodos.has(todo.account.idx)
                        const todoIdx = todo.account.idx
                        
                        return (
                            <div 
                                key={todo.publicKey.toString()} 
                                className={`${styles.todoItem} ${isCompleted ? styles.completed : ''}`}
                            >
                                <div 
                                    className={`${styles.todoCheckbox} ${isCompleted ? styles.checked : ''}`}
                                    onClick={() => {
                                        if (!isCompleted && !disabled && !isProcessing && markAction) {
                                            handleMarkComplete(todoIdx, todo.publicKey.toString())
                                        }
                                    }}
                                    style={{ cursor: isCompleted || disabled || isProcessing || !markAction ? 'not-allowed' : 'pointer' }}
                                />
                                
                                <div className={styles.todoContent}>
                                    <div className={styles.todoText}>
                                        {todo.account.content}
                                    </div>
                                    
                                    <div className={styles.todoMeta}>
                                        <div className={styles.todoDateline}>
                                            <span className={styles.calendarIcon}>📅</span>
                                            <span>{formatDate(todo.account.createdAt)}</span>
                                        </div>
                                        
                                        <div className={styles.todoStatus}>
                                            <div className={styles.statusDot}></div>
                                            <span>{getTimeAgo(todo.account.createdAt)}</span>
                                        </div>
                                        
                                        <div className={styles.priorityBadge}>
                                            <span>#{todoIdx}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.todoActions}>
                                    {/* Show remove button only for completed todos */}
                                    {isCompleted && removeAction && (
                                        <button
                                            className={styles.actionButton}
                                            onClick={() => !disabled && !isProcessing && handleRemove(todoIdx, todo.publicKey.toString())}
                                            disabled={disabled || isProcessing}
                                            title="Remove Todo"
                                        >
                                            {isProcessing ? (
                                                <div className={styles.loadingSpinner}></div>
                                            ) : (
                                                <span className={styles.trashIcon}>🗑️</span>
                                            )}
                                        </button>
                                    )}
                                    
                                    {/* Show mark complete button only for active todos */}
                                    {!isCompleted && markAction && (
                                        <button
                                            className={styles.actionButton}
                                            onClick={() => !disabled && !isProcessing && handleMarkComplete(todoIdx, todo.publicKey.toString())}
                                            disabled={disabled || isProcessing}
                                            title="Mark Complete"
                                        >
                                            {isProcessing ? (
                                                <div className={styles.loadingSpinner}></div>
                                            ) : (
                                                <span className={styles.markCompleteIcon}>✅</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default TodoSection