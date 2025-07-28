import { Component, OnInit } from '@angular/core';
import { Blog, BlogService } from '../services/blogs.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-single-blog',
  imports: [CommonModule],
  templateUrl: './single-blog.html',
  styleUrl: './single-blog.scss'
})
export class SingleBlog implements OnInit {
  blog: Blog | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.blogService.getBlogById(id).subscribe({
        next: (data) => {
          this.blog = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message;
          this.isLoading = false;
        }
      });
    }
  }
}