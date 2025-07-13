import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Blog, BlogService } from '../../../services/blogs.service';
import { AssetUtils } from '../../../utils/asset.utils';
import { TruncatePipe } from '../../../pipes/truncate-pipe';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule,TruncatePipe],
  templateUrl: './blogs.html',
  styleUrl: './blogs.scss',
})
export class Blogs implements OnInit {
  blogs: Blog[] = [];
  groupedBlogs: Blog[][] = [];
  loading = true;
  error: string | null = null;

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.blogService.getBlogs().subscribe({
      next: (blogs) => {
        this.blogs = blogs;
        this.groupedBlogs = this.groupBlogs(blogs);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      },
    });
  }

  groupBlogs(blogs: Blog[]): Blog[][] {
    const grouped: Blog[][] = [];
    for (let i = 0; i < blogs.length; i += 3) {
      grouped.push(blogs.slice(i, i + 3));
    }
    return grouped;
  }

  getSafeImage(url: string): string {
    return AssetUtils.getSafeImageUrl(url);
  }

  parseContent(content: string): string {
    try {
      const parsed = JSON.parse(content);
      if (parsed.ops) {
        return parsed.ops
          .filter((op: any) => op.insert)
          .map((op: any) => {
            let text = op.insert;
            if (op.attributes?.bold) {
              text = `<strong>${text}</strong>`;
            }
            if (op.attributes?.color) {
              text = `<span style="color:${op.attributes.color}">${text}</span>`;
            }
            return text;
          })
          .join('')
          .replace(/\n/g, '<br>');
      }
      return content;
    } catch {
      return content;
    }
  }
}
