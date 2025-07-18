import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useTodo } from '../hooks/todo'
import Loading from '../components/Loading'
import TodoSection from '../components/todo/TodoSection'
import styles from '../styles/Home.module.css'

const Home = () => {
    const { 
        initialized, 
        initializeUser, 
        loading, 
        transactionPending, 
        processingTodos,
        completedTodos, 
        incompleteTodos, 
        addTodo,
        markTodo,
        removeTodo,
        input,  
        handleChange 
    } = useTodo()

    const handleSubmit = (e) => {
        e.preventDefault()
        if (input.trim()) {
            addTodo(e)
        }
    }

    const totalTodos = incompleteTodos.length + completedTodos.length

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                <h1 className={styles.appTitle}>✨ TodoChain</h1>
                <p className={styles.appSubtitle}>Decentralized Task Management on Solana</p>
            </div>

            {/* Actions Container */}
            <div className={styles.actionsContainer}>
                {initialized ? (
                    <div className={styles.todoInputContainer}>
                        <form onSubmit={handleSubmit} className={styles.todoInputForm}>
                            <div className={styles.todoCheckbox}></div>
                            <div className={styles.inputContainer}>
                                <input 
                                    value={input} 
                                    onChange={handleChange} 
                                    className={styles.inputField}
                                    type="text" 
                                    placeholder='What needs to be done?' 
                                    disabled={transactionPending}
                                />
                            </div>
                            <button 
                                type="submit" 
                                className={styles.submitButton}
                                disabled={transactionPending || !input.trim()}
                            >
                                {transactionPending ? (
                                    <>
                                        <div className={styles.loadingSpinner}></div>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <span>➕</span>
                                        Add Todo
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <button 
                        type="button" 
                        className={styles.button} 
                        onClick={() => initializeUser()} 
                        disabled={transactionPending}
                    >
                        {transactionPending ? (
                            <>
                                <div className={styles.loadingSpinner}></div>
                                Initializing...
                            </>
                        ) : (
                            <>
                                🚀 Initialize Account
                            </>
                        )}
                    </button>
                )}
                <WalletMultiButton />
            </div>

            {/* Stats Section */}
            {initialized && (
                <div className={styles.statsContainer}>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{totalTodos}</div>
                        <div className={styles.statLabel}>Total Tasks</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{incompleteTodos.length}</div>
                        <div className={styles.statLabel}>Active</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{completedTodos.length}</div>
                        <div className={styles.statLabel}>Completed</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>
                            {totalTodos > 0 ? Math.round((completedTodos.length / totalTodos) * 100) : 0}%
                        </div>
                        <div className={styles.statLabel}>Progress</div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={styles.mainContainer}>
                <Loading loading={loading}>
                    {!initialized ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>🔗</div>
                            <div className={styles.emptyStateText}>Welcome to TodoChain</div>
                            <div className={styles.emptyStateSubtext}>
                                Connect your wallet and initialize your account to get started
                            </div>
                        </div>
                    ) : (
                        <>
                            <TodoSection 
                                title="📋 Active Tasks" 
                                todos={incompleteTodos} 
                                markAction={markTodo}        // Pass markTodo function
                                removeAction={null}          // No remove action for active todos
                                processingTodos={processingTodos}
                                disabled={transactionPending}
                                emptyMessage="No active tasks"
                                emptySubtext="Add a new task to get started!"
                            />

                            <TodoSection 
                                title="✅ Completed Tasks" 
                                todos={completedTodos} 
                                markAction={null}            // No mark action for completed todos
                                removeAction={removeTodo}    // Pass removeTodo function
                                processingTodos={processingTodos}
                                disabled={transactionPending}
                                emptyMessage="No completed tasks yet"
                                emptySubtext="Complete some tasks to see them here!"
                            />
                        </>
                    )}
                </Loading>
            </div>
        </div>
    )
}

export default Home