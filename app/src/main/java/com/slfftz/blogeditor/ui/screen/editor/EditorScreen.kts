package com.slfftz.blogeditor.ui.screen.editor

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun EditorScreen(onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("编辑页", style = MaterialTheme.typography.headlineSmall)
        Text("编辑 / 预览 / 分屏 + 插图 —— 下一批实现")
        Button(onClick = onBack) { Text("返回") }
    }
}