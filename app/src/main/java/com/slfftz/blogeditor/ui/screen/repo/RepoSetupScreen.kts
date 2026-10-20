package com.slfftz.blogeditor.ui.screen.repo

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun RepoSetupScreen(onDone: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("仓库配置", style = MaterialTheme.typography.headlineSmall)
        Text("远程 URL / 用户名 / PAT / 分支 / Clone 按钮 —— 下一批实现")
        Button(onClick = onDone) { Text("临时跳过") }
    }
}