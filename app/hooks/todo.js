import * as anchor from '@project-serum/anchor'
import { useEffect, useMemo, useState } from 'react'
import { TODO_PROGRAM_PUBKEY } from '../constants'
import todoIDL from '../constants/todo.json'
import toast from 'react-hot-toast'
import { SystemProgram } from '@solana/web3.js'
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { authorFilter } from '../utils'

export function useTodo() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const anchorWallet = useAnchorWallet()

    const [initialized, setInitialized] = useState(false)
    const [lastTodo, setLastTodo] = useState(0)
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(false)
    const [transactionPending, setTransactionPending] = useState(false)
    const [processingTodos, setProcessingTodos] = useState(new Set()) // Track which todos are being processed
    const [input, setInput] = useState("")

    const program = useMemo(() => {
        if (anchorWallet) {
            const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions())
            return new anchor.Program(todoIDL, TODO_PROGRAM_PUBKEY, provider)
        }
    }, [connection, anchorWallet])

    // Function to refresh todos from blockchain
    const refreshTodos = async () => {
        if (program && publicKey) {
            try {
                const todoAccounts = await program.account.todoAccount.all([authorFilter(publicKey)])
                setTodos(todoAccounts)
                
                // Also refresh user profile to get latest lastTodo
                const [profilePda] = findProgramAddressSync(
                    [utf8.encode('USER_STATE'), publicKey.toBuffer()], 
                    program.programId
                )
                const profileAccount = await program.account.userProfile.fetch(profilePda)
                setLastTodo(profileAccount.lastTodo)
            } catch (error) {
                console.error("Error refreshing todos:", error)
            }
        }
    }

    // Initial load
    useEffect(() => {
        const findProfileAccounts = async () => {
            if (program && publicKey && !transactionPending) {
                try {
                    setLoading(true)
                    const [profilePda] = findProgramAddressSync(
                        [utf8.encode('USER_STATE'), publicKey.toBuffer()], 
                        program.programId
                    )
                    
                    const profileAccount = await program.account.userProfile.fetch(profilePda)

                    if (profileAccount) {
                        setLastTodo(profileAccount.lastTodo)
                        setInitialized(true)
                        await refreshTodos()
                    } else {
                        setInitialized(false)
                    }
                } catch (error) {
                    console.error("Error fetching todos:", error)
                    setInitialized(false)
                    setTodos([])
                } finally {
                    setLoading(false)   
                }
            }
        }

        findProfileAccounts();
    }, [program, publicKey])

    const handleChange = (e) => {
        setInput(e.target.value)
    }

    // Initialize user on blockchain
    const initializeUser = async () => {
        if (program && publicKey) {
            try {
                setTransactionPending(true)
                const [profilePda] = findProgramAddressSync(
                    [utf8.encode('USER_STATE'), publicKey.toBuffer()], 
                    program.programId
                )

                const tx = await program.methods.initializeUser()
                    .accounts({
                        userProfile: profilePda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId
                    })
                    .rpc()

                setInitialized(true)
                console.log("Transaction successful:", tx)
                toast.success("User initialized successfully!")
                
            } catch (error) {
                console.error("Error initializing user:", error)
                toast.error("Failed to initialize user. Please try again.")
            } finally {
                setTransactionPending(false)
            }
        }
    }

    // Add todo to blockchain
    const addTodo = async (e) => {
        e.preventDefault()
        if (program && publicKey && input.trim() && !transactionPending) {
            try {
                setTransactionPending(true)
                
                const [profilePda] = findProgramAddressSync(
                    [utf8.encode('USER_STATE'), publicKey.toBuffer()], 
                    program.programId
                )

                const [todoPda] = findProgramAddressSync(
                    [utf8.encode('TODO_STATE'), publicKey.toBuffer(), Buffer.from([lastTodo])], 
                    program.programId
                )

                const tx = await program.methods.addTodo(input.trim())
                    .accounts({
                        userProfile: profilePda,
                        todoAccount: todoPda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId
                    })
                    .rpc()

                console.log("Todo added successfully:", tx)
                toast.success("Todo added successfully!")
                setInput("")
                
                // Refresh todos after successful transaction
                await refreshTodos()
                
            } catch (error) {
                console.error("Error adding todo:", error)
                toast.error("Failed to add todo. Please try again.")
            } finally {
                setTransactionPending(false)
            }
        }
    }

    // Mark todo as completed on blockchain
    const markTodo = async (todoIdx) => {
        if (program && publicKey && !transactionPending && !processingTodos.has(todoIdx)) { 
            try {
                setTransactionPending(true)
                setProcessingTodos(prev => new Set([...prev, todoIdx]))
                
                const [profilePda] = findProgramAddressSync(
                    [utf8.encode('USER_STATE'), publicKey.toBuffer()], 
                    program.programId
                )

                const [todoPda] = findProgramAddressSync(
                    [utf8.encode('TODO_STATE'), publicKey.toBuffer(), Buffer.from([todoIdx])], 
                    program.programId
                )

                // Check if todo is already marked to prevent duplicate transactions
                const currentTodo = todos.find(todo => todo.account.idx === todoIdx)
                if (currentTodo && currentTodo.account.marked) {
                    toast.error("Todo is already marked as completed!")
                    return
                }

                const tx = await program.methods.markTodo(todoIdx)
                    .accounts({
                        userProfile: profilePda,
                        todoAccount: todoPda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId
                    })
                    .rpc()

                console.log("Todo marked successfully:", tx)
                toast.success("Todo marked as completed!")
                
                // Refresh from blockchain after successful transaction
                await refreshTodos()
                
            } catch (error) {
                console.error("Error marking todo:", error)
                if (error.message && error.message.includes("already been processed")) {
                    toast.error("Transaction already processed. Refreshing...")
                    await refreshTodos()
                } else {
                    toast.error("Failed to mark todo. Please try again.")
                }
            } finally {
                setTransactionPending(false)
                setProcessingTodos(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(todoIdx)
                    return newSet
                })
            }
        }
    }

    // Remove todo from blockchain
    const removeTodo = async (todoIdx) => {
        if (program && publicKey && !transactionPending && !processingTodos.has(todoIdx)) {
            try {
                setTransactionPending(true)
                setProcessingTodos(prev => new Set([...prev, todoIdx]))
                
                const [profilePda] = findProgramAddressSync(
                    [utf8.encode('USER_STATE'), publicKey.toBuffer()], 
                    program.programId
                )

                const [todoPda] = findProgramAddressSync(
                    [utf8.encode('TODO_STATE'), publicKey.toBuffer(), Buffer.from([todoIdx])], 
                    program.programId
                )

                // Check if todo exists before attempting to remove
                const currentTodo = todos.find(todo => todo.account.idx === todoIdx)
                if (!currentTodo) {
                    toast.error("Todo not found!")
                    return
                }

                const tx = await program.methods.removeTodo(todoIdx)
                    .accounts({
                        userProfile: profilePda,
                        todoAccount: todoPda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId
                    })
                    .rpc()

                console.log("Todo removed successfully:", tx)
                toast.success("Todo removed successfully!")
                
                // Refresh from blockchain after successful transaction
                await refreshTodos()
                
            } catch (error) {
                console.error("Error removing todo:", error)
                if (error.message && error.message.includes("already been processed")) {
                    toast.error("Transaction already processed. Refreshing...")
                    await refreshTodos()
                } else {
                    toast.error("Failed to remove todo. Please try again.")
                }
            } finally {
                setTransactionPending(false)
                setProcessingTodos(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(todoIdx)
                    return newSet
                })
            }
        }
    }
    
    const incompleteTodos = useMemo(() => todos.filter((todo) => !todo.account.marked), [todos])
    const completedTodos = useMemo(() => todos.filter((todo) => todo.account.marked), [todos])

    return { 
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
        setInput, 
        handleChange 
    }
}