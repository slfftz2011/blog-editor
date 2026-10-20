package com.slfftz.blogeditor.ui.screen.filelist

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun FileListScreen(onOpen: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("文件列表", style = MaterialTheme.typography.headlineSmall)
        Text("md 文件列表 —— 下一批实现")
        Button(onClick = onOpen) { Text("打开编辑页") }
    }
}