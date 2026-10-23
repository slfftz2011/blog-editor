package com.slfftz.blogeditor

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.navigation.compose.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.dp
import java.io.File

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
    val context = LocalContext.current
    val crashFile = remember {
        File(context.getExternalFilesDir("crash") ?: context.filesDir, "last_crash.txt")
    }
    var crashText by remember {
        mutableStateOf(if (crashFile.exists()) crashFile.readText() else null)
    }

    if (crashText != null) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)
        ) {
            Text("上次崩溃日志", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(8.dp))
            Text(crashText!!, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(12.dp))
            Button(onClick = {
                crashFile.delete()
                crashText = null
            }) { Text("清除并继续") }
        }
        return
    }

    val nav = rememberNavController()
    NavHost(nav, startDestination = "repo") {
        composable("repo") { RepoSetupScreen(onDone = { nav.navigate("files") }) }
        composable("files") { FileListScreen(onOpen = { nav.navigate("editor") }) }
        composable("editor") { EditorScreen(onBack = { nav.popBackStack() }) }
    }
}