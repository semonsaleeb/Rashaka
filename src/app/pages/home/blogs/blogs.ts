import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Blog, BlogService } from '../../../services/blogs.service';
import { AssetUtils } from '../../../utils/asset.utils';
import { TruncatePipe } from '../../../pipes/truncate-pipe';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, TruncatePipe],
  templateUrl: './blogs.html',
  styleUrls: ['./blogs.scss'],
})
export class Blogs implements OnInit {
  @Input() mode: 'carousel' | 'grid' = 'grid';
  blogs: Blog[] = [];
  loading = true;
  currentSlideIndex = 0;
  visibleCards = 3;

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.blogService.getBlogs().subscribe({
      next: (blogs) => {
        this.blogs = blogs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load blogs:', err);
        this.loading = false;
      }
    });
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

  getDotsArray(): number[] {
    const slideCount = Math.ceil(this.blogs.length / this.visibleCards);
    return Array.from({ length: slideCount }, (_, i) => i);
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  nextSlide(): void {
    if (this.currentSlideIndex < this.blogs.length - this.visibleCards) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }
}