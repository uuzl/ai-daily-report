        async function solveMaze() {
          if (!currentMaze) {
            alert('请先生成迷宫！');
            return;
          }
          
          const solveBtn = document.querySelector('.solve-btn');
          solveBtn.disabled = true;
          
          const path = solveMazeBFS(currentMaze);
          
          if (!path) {
            alert('未找到路径！');
            solveBtn.disabled = false;
            return;
          }
          
          // 逐步绘制路径动画
          for (let i = 0; i < path.length; i++) {
            drawMaze(currentMaze, cellSize, path.slice(0, i + 1));
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          
          // 寻路成功提示
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('✅ 寻路成功', {
              body: `已找到从入口到出口的最短路径，共 ${path.length} 步`,
              icon: '✅'
            });
          } else if ('Notification' in window && Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              new Notification('✅ 寻路成功', {
                body: `已找到从入口到出口的最短路径，共 ${path.length} 步`,
                icon: '✅'
              });
            }
          }
          
          solveBtn.disabled = false;
        }