package com.slfftz.blogeditor

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.navigation.compose.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface { AppNavHost() }
            }
        }
    }
}

@Composable
fun AppNavHost() {
    val nav = rememberNavController()
    NavHost(nav, startDestination = "repo") {
        composable("repo") { RepoSetupScreen(onDone = { nav.navigate("files") }) }
        composable("files") { FileListScreen(onOpen = { nav.navigate("editor") }) }
        composable("editor") { EditorScreen(onBack = { nav.popBackStack() }) }
    }
}